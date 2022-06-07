import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AzureSession } from "../../../models/azure/azure-session";
import { Session } from "../../../models/session";
import { ExecuteService } from "../../execute-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { SessionService } from "../session-service";
import { AzureSessionRequest } from "./azure-session-request";
import { LoggedException, LogLevel } from "../../log-service";
import { INativeService } from "../../../interfaces/i-native-service";
import { JsonCache } from "@azure/msal-node";
import { MsalPersistenceService } from "../../msal-persistence-service";

export class AzureService extends SessionService {
  private vault: any; // TODO: remove!

  constructor(
    iSessionNotifier: IBehaviouralNotifier,
    repository: Repository,
    private fileService: FileService,
    private executeService: ExecuteService,
    private azureMsalCacheFile: string,
    private nativeService: INativeService,
    private msalPersistenceService: MsalPersistenceService
  ) {
    super(iSessionNotifier, repository);
  }

  getDependantSessions(_: string): Session[] {
    return [];
  }

  async create(sessionRequest: AzureSessionRequest): Promise<void> {
    const session = new AzureSession(sessionRequest.sessionName, sessionRequest.region, sessionRequest.subscriptionId, sessionRequest.tenantId);
    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
  }

  async start(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);

    const session = this.repository.getSessionById(sessionId);

    //await this.generateCredentials(sessionId);

    try {
      // az account set —subscription <xxx> 2>&1
      await this.executeService.execute(`az account set --subscription ${(session as AzureSession).subscriptionId} 2>&1`);
      // az configure —default location <region(location)>
      await this.executeService.execute(`az configure --default location=${(session as AzureSession).region} 2>&1`);
      // delete refresh token from accessTokens
      //(FOR VERSION >= 2.30.0)
      /*if (this.accessTokenFileExists()) {
        this.deleteRefreshToken();
      }*/
    } catch (err) {
      this.sessionDeactivated(sessionId);
      throw new LoggedException(err.message, this, LogLevel.warn);
    }

    this.sessionActivate(sessionId);
    return Promise.resolve(undefined);
  }

  async rotate(sessionId: string): Promise<void> {
    return this.start(sessionId);
  }

  async stop(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);
    try {
      await this.executeService.execute(`az account clear 2>&1`);
      await this.executeService.execute(`az configure --defaults location='' 2>&1`);
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    } finally {
      this.sessionDeactivated(sessionId);
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      //TODO: check if session is currently active before trying to stop it?
      await this.stop(sessionId);
      this.repository.deleteSession(sessionId);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
    } catch (error) {
      throw new LoggedException(error.message, this, LogLevel.warn);
    }
  }

  validateCredentials(_sessionId: string): Promise<boolean> {
    return Promise.resolve(false);
    /*return new Promise((resolve, _) => {
      this.generateCredentials(sessionId)
        .then((__) => {
          this.sessionDeactivated(sessionId);
          resolve(true);
        })
        .catch((__) => {
          this.sessionDeactivated(sessionId);
          resolve(false);
        });
    });*/
  }

  /*


  *******


   */

  async checkCliVersion(): Promise<void> {
    let output;
    try {
      output = await this.executeService.execute(`az --version`);
    } catch (stdError) {
      throw new LoggedException("Azure CLI is not installed", this, LogLevel.error, true);
    }

    const tokens = output.split(/\s+/);
    const versionToken = tokens.find((token) => token.match(/^\d+\.\d+\.\d+$/));
    if (versionToken) {
      const [major, minor] = versionToken.split(".").map((v) => parseInt(v, 10));
      if (major < 2 || (major === 2 && minor < 30)) {
        throw new LoggedException("Unsupported Azure CLI version (< 2.30). Please update.", this, LogLevel.error, true);
      }
    } else {
      throw new LoggedException("Unknown Azure CLI version", this, LogLevel.error, true);
    }
  }

  async login(session: AzureSession): Promise<void> {
    try {
      await this.executeService.execute(`az login --tenant ${session.tenantId} 2>&1`);
      await this.secureRefreshToken();
      await this.updateAccessTokenExpiration(session);
    } catch (err) {
      this.sessionDeactivated(session.sessionId);
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }

  async refreshAccessToken(session: AzureSession): Promise<void> {
    try {
      await this.restoreRefreshToken();
      await this.executeService.execute(`az account get-access-token --subscription ${session.subscriptionId}`);
      await this.secureRefreshToken();
      await this.updateAccessTokenExpiration(session);
    } catch (error) {
      await this.logout();
      await this.login(session);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.executeService.execute("az logout");
    } catch (stdError) {}
  }

  private async secureRefreshToken(): Promise<void> {
    const msalCache = await this.loadMsalCache();
    this.vault = { refreshToken: msalCache.RefreshToken };
    msalCache.RefreshToken = {};
    await this.persistMsalCache(msalCache);
  }

  private async restoreRefreshToken(): Promise<void> {
    const msalCache = await this.loadMsalCache();
    msalCache.AccessToken = {};
    msalCache.IdToken = {};
    msalCache.RefreshToken = this.vault.refreshToken;
    await this.persistMsalCache(msalCache);
  }

  private async updateAccessTokenExpiration(session: AzureSession): Promise<void> {
    const msalCache = await this.loadMsalCache();
    const accessTokenKeys = Object.keys(msalCache.AccessToken);
    for (const accessTokenKey of accessTokenKeys) {
      const accessToken = msalCache.AccessToken[accessTokenKey];
      if (accessToken?.realm === session.tenantId) {
        const expirationTime = new Date(parseInt(accessToken?.expires_on, 10) * 1000);
        session.sessionTokenExpiration = expirationTime.toISOString();
        break;
      }
    }
  }

  private async loadMsalCache(): Promise<JsonCache> {
    return this.msalPersistenceService.load();
  }

  private async persistMsalCache(msalCache: JsonCache): Promise<void> {
    await this.msalPersistenceService.save(msalCache);
  }
}
