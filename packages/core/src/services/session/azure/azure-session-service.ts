import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AzureSession } from "../../../models/azure/azure-session";
import { Session } from "../../../models/session";
import { ExecuteService } from "../../execute-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { SessionService } from "../session-service";
import { AzureSessionRequest } from "./azure-session-request";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "../../log-service";
import { INativeService } from "../../../interfaces/i-native-service";
import { JsonCache } from "@azure/msal-node";
import { AzurePersistenceService } from "../../azure-persistence-service";
import { SessionStatus } from "../../../models/session-status";
import { constants } from "../../../models/constants";

export class AzureSessionService extends SessionService {
  constructor(
    iSessionNotifier: IBehaviouralNotifier,
    repository: Repository,
    private fileService: FileService,
    private executeService: ExecuteService,
    private azureMsalCacheFile: string,
    private nativeService: INativeService,
    private azurePersistenceService: AzurePersistenceService,
    private logService: LogService
  ) {
    super(iSessionNotifier, repository);
  }

  getDependantSessions(_: string): Session[] {
    return [];
  }

  async create(sessionRequest: AzureSessionRequest): Promise<void> {
    const session = new AzureSession(
      sessionRequest.sessionName,
      sessionRequest.region,
      sessionRequest.subscriptionId,
      sessionRequest.tenantId,
      sessionRequest.azureIntegrationId
    );
    this.repository.addSession(session);
    this.sessionNotifier.setSessions(this.repository.getSessions());
  }

  async start(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);
    let sessionTokenExpiration;
    const session = this.repository.getSessionById(sessionId) as AzureSession;
    try {
      await this.restoreSecretsFromKeychain(session.azureIntegrationId, session.subscriptionId);
      await this.executeService.execute(`az configure --default location=${session.region}`);
      await this.executeService.execute(`az account get-access-token --subscription ${session.subscriptionId}`);
      const msalTokenCache = await this.azurePersistenceService.loadMsalCache();
      await this.moveRefreshTokenToKeychain(msalTokenCache, session.azureIntegrationId, session.tenantId);
      sessionTokenExpiration = await this.getAccessTokenExpiration(msalTokenCache, session.tenantId);
    } catch (err) {
      this.sessionDeactivated(sessionId);
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
    this.sessionActivated(sessionId, sessionTokenExpiration);
  }

  async rotate(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const tokenExpiration = new Date(session.sessionTokenExpiration).getTime();
    const oneMinuteMargin = 60 * 1000;
    const nextRotation = new Date().getTime() + constants.sessionDuration * 1000 + oneMinuteMargin;
    if (nextRotation > tokenExpiration) {
      await this.start(sessionId);
    }
  }

  async stop(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);
    try {
      await this.executeService.execute("az logout");
    } catch (err) {
      this.logService.log(new LoggedEntry(err.message, this, LogLevel.warn));
    } finally {
      this.sessionDeactivated(sessionId);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      if (this.repository.getSessionById(sessionId).status !== SessionStatus.inactive) {
        await this.stop(sessionId);
      }
      this.repository.deleteSession(sessionId);
      this.sessionNotifier.setSessions(this.repository.getSessions());
    } catch (error) {
      throw new LoggedException(error.message, this, LogLevel.warn);
    }
  }

  async validateCredentials(_sessionId: string): Promise<boolean> {
    return false;
  }

  private async restoreSecretsFromKeychain(integrationId: string, subscriptionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let msalTokenCache = { Account: {}, IdToken: {}, AccessToken: {}, RefreshToken: {}, AppMetadata: {} } as JsonCache;
    try {
      msalTokenCache = await this.azurePersistenceService.loadMsalCache();
    } catch (error) {}

    const secrets = await this.azurePersistenceService.getAzureSecrets(integrationId);
    msalTokenCache.Account = { [secrets.account[0]]: secrets.account[1] };
    msalTokenCache.RefreshToken = { [secrets.refreshToken[0]]: secrets.refreshToken[1] };
    msalTokenCache.AccessToken = {};
    msalTokenCache.IdToken = {};
    await this.azurePersistenceService.saveMsalCache(msalTokenCache);

    const profile = secrets.profile;
    const subscription = profile.subscriptions.find((sub) => sub.id === subscriptionId);
    subscription.isDefault = true;
    profile.subscriptions = [subscription];
    await this.azurePersistenceService.saveProfile(profile);
  }

  private async moveRefreshTokenToKeychain(msalTokenCache: JsonCache, integrationId: string, tenantId: string): Promise<void> {
    const accessToken = Object.values(msalTokenCache.AccessToken).find((tokenObj) => tokenObj.realm === tenantId);
    const refreshTokenEntry = Object.entries(msalTokenCache.RefreshToken).find(
      (refreshTokenArr) => refreshTokenArr[1].home_account_id === accessToken.home_account_id
    );
    const secrets = await this.azurePersistenceService.getAzureSecrets(integrationId);
    secrets.refreshToken = refreshTokenEntry;
    await this.azurePersistenceService.setAzureSecrets(integrationId, secrets);
    msalTokenCache.RefreshToken = {};
    await this.azurePersistenceService.saveMsalCache(msalTokenCache);
  }

  private async getAccessTokenExpiration(msalTokenCache: JsonCache, tenantId: string): Promise<string> {
    const accessToken = Object.values(msalTokenCache.AccessToken).find((tokenObj) => tokenObj.realm === tenantId);
    const expirationTime = new Date(parseInt(accessToken.expires_on, 10) * 1000);
    return expirationTime.toISOString();
  }
}
