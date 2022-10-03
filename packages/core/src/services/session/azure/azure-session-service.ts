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
import { SessionType } from "../../../models/session-type";
import { CreateSessionRequest } from "../create-session-request";

// TODO: refactor by calling AzureIntegrationService instead of Repository
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
    const session = this.repository.getSessionById(sessionId) as AzureSession;
    await this.stopAllOtherSessions(sessionId);
    this.sessionLoading(sessionId);

    const subscriptionIdsToStart = this.repository
      .getSessions()
      .filter(
        (sess: AzureSession) =>
          sess.type === SessionType.azure &&
          (sess.status !== SessionStatus.inactive || sess.sessionId === sessionId) &&
          sess.azureIntegrationId === session.azureIntegrationId
      )
      .map((sess: AzureSession) => sess.subscriptionId);

    let sessionTokenExpiration;
    try {
      const integration = this.repository.getAzureIntegration(session.azureIntegrationId);
      const tokenExpiration = new Date(integration.tokenExpiration).getTime();

      await this.executeService.execute(`az configure --default location=${integration.region}`);

      await this.updateProfiles(session.azureIntegrationId, subscriptionIdsToStart, session.subscriptionId);

      if (integration.tokenExpiration === undefined || this.getNextRotationTime() > tokenExpiration) {
        await this.restoreSecretsFromKeychain(session.azureIntegrationId);
        await this.executeService.execute(`az account get-access-token --subscription ${session.subscriptionId}`, undefined, true);
        const msalTokenCache = await this.azurePersistenceService.loadMsalCache();
        const accessToken = Object.values(msalTokenCache.AccessToken).find((tokenObj) => tokenObj.realm === session.tenantId);

        this.repository.updateAzureIntegration(
          integration.id,
          integration.alias,
          integration.tenantId,
          integration.region,
          integration.isOnline,
          accessToken.expires_on
        );
        await this.moveRefreshTokenToKeychain(msalTokenCache, session.azureIntegrationId, session.tenantId);
        sessionTokenExpiration = await this.getAccessTokenExpiration(msalTokenCache, session.tenantId);
      }
    } catch (err) {
      this.sessionDeactivated(sessionId);
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
    this.sessionActivated(sessionId, sessionTokenExpiration);
  }

  async rotate(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const integration = this.repository.getAzureIntegration((session as AzureSession).azureIntegrationId);

    const tokenExpiration = new Date(integration.tokenExpiration).getTime();

    if (this.getNextRotationTime() > tokenExpiration) {
      await this.start(sessionId);
    }
  }

  async stop(sessionId: string): Promise<void> {
    if (this.isInactive(sessionId)) {
      return;
    }
    this.sessionLoading(sessionId);
    try {
      const session = this.repository.getSessionById(sessionId) as AzureSession;
      const subscriptionId = session.subscriptionId;

      const profile = await this.azurePersistenceService.loadProfile();
      let newProfileSubscriptions = [];

      if (profile.subscriptions.length > 1) {
        newProfileSubscriptions = profile.subscriptions.filter((sub) => sub.id !== subscriptionId);
        if (newProfileSubscriptions.filter((sub) => sub.isDefault === true).length === 0) {
          newProfileSubscriptions[0].isDefault = true;
        }
        profile.subscriptions = newProfileSubscriptions;
        await this.azurePersistenceService.saveProfile(profile);
      } else {
        await this.executeService.execute("az logout");
        const integration = this.repository.getAzureIntegration(session.azureIntegrationId);
        this.repository.updateAzureIntegration(
          integration.id,
          integration.alias,
          integration.tenantId,
          integration.region,
          integration.isOnline,
          undefined
        );
      }
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

  async getCloneRequest(session: AzureSession): Promise<AzureSessionRequest> {
    throw new LoggedException(`Clone is not supported for sessionType ${session.type}`, this, LogLevel.error, false);
  }

  update(_: string, __: CreateSessionRequest): Promise<void> {
    throw new LoggedException(`Update is not supported for Azure Session Type`, this, LogLevel.error, false);
  }

  private async restoreSecretsFromKeychain(integrationId: string): Promise<void> {
    let msalTokenCache: JsonCache;
    try {
      msalTokenCache = await this.azurePersistenceService.loadMsalCache();
    } catch (error) {
      throw new LoggedException(error.message, this, LogLevel.warn);
    }

    const secrets = await this.azurePersistenceService.getAzureSecrets(integrationId);
    msalTokenCache.Account = { [secrets.account[0]]: secrets.account[1] };
    msalTokenCache.RefreshToken = { [secrets.refreshToken[0]]: secrets.refreshToken[1] };
    msalTokenCache.AccessToken = {};
    msalTokenCache.IdToken = {};
    await this.azurePersistenceService.saveMsalCache(msalTokenCache);
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

  private async updateProfiles(integrationId: string, subscriptionIdsToStart: string[], subscriptionId: string): Promise<void> {
    const secrets = await this.azurePersistenceService.getAzureSecrets(integrationId);
    const profile = secrets.profile;
    const subscriptions = profile.subscriptions
      .filter((sub) => subscriptionIdsToStart.includes(sub.id))
      .map((sub) => Object.assign(sub, { isDefault: sub.id === subscriptionId }));
    profile.subscriptions = subscriptions;
    await this.azurePersistenceService.saveProfile(profile);
  }

  private async stopAllOtherSessions(sessionId: string): Promise<void> {
    const sessionsToStop = this.repository
      .getSessions()
      .filter((sess: AzureSession) => sess.type === SessionType.azure && sess.sessionId !== sessionId && sess.status !== SessionStatus.inactive);
    for (const sess of sessionsToStop) {
      await this.stop(sess.sessionId);
    }
  }

  private getNextRotationTime(): number {
    const oneMinuteMargin = 60 * 1000;
    return new Date().getTime() + constants.sessionDuration * 1000 + oneMinuteMargin;
  }
}
