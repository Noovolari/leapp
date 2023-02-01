import { IBehaviouralNotifier } from "../../interfaces/i-behavioural-notifier";
import { IIntegrationService } from "../../interfaces/i-integration-service";
import { INativeService } from "../../interfaces/i-native-service";
import { Repository } from "../repository";
import { SessionFactory } from "../session-factory";
import { Integration } from "../../models/integration";
import { AzureIntegration } from "../../models/azure/azure-integration";
import { ExecuteService } from "../execute-service";
import { AzurePersistenceService, AzureProfile } from "../azure-persistence-service";
import { LoggedException, LogLevel } from "../log-service";
import { AzureIntegrationCreationParams } from "../../models/azure/azure-integration-creation-params";
import { AzureSessionRequest } from "../session/azure/azure-session-request";
import { AzureSessionService } from "../session/azure/azure-session-service";
import { SessionType } from "../../models/session-type";
import { AzureSession } from "../../models/azure/azure-session";
import { SessionStatus } from "../../models/session-status";

export class AzureIntegrationService implements IIntegrationService {
  constructor(
    public repository: Repository,
    public behaviouralNotifier: IBehaviouralNotifier,
    public nativeService: INativeService,
    public sessionFactory: SessionFactory,
    public executeService: ExecuteService,
    public azureSessionService: AzureSessionService,
    public azurePersistenceService: AzurePersistenceService
  ) {}

  static validateAlias(alias: string): boolean | string {
    return alias.trim() !== "" ? true : "Empty alias";
  }

  static validateTenantId(tenantId: string): boolean | string {
    return tenantId.trim() !== "" ? true : "Empty tenant id";
  }

  async checkCliVersion(): Promise<void> {
    let output;
    try {
      output = await this.executeService.execute("az --version");
    } catch (stdError) {
      throw new LoggedException("Azure CLI is not installed.", this, LogLevel.error, true);
    }

    const tokens = output.split(/\s+/);
    const versionToken = tokens.find((token) => token.match(/^\d+\.\d+\.\d+$/));
    if (versionToken) {
      const [major, minor] = versionToken.split(".").map((v) => parseInt(v, 10));
      if (major < 2 || (major === 2 && minor < 30)) {
        throw new LoggedException("Unsupported Azure CLI version (< 2.30). Please update Azure CLI.", this, LogLevel.error, true);
      }
    } else {
      throw new LoggedException("Unknown Azure CLI version.", this, LogLevel.error, true);
    }
  }

  async createIntegration(creationParams: AzureIntegrationCreationParams, _integrationId?: string): Promise<void> {
    await this.checkCliVersion();
    const defaultLocation = this.repository.getDefaultLocation();
    this.repository.addAzureIntegration(creationParams.alias, creationParams.tenantId, creationParams.region ?? defaultLocation);
  }

  updateIntegration(id: string, updateParams: AzureIntegrationCreationParams): void {
    const isOnline = this.repository.getAzureIntegration(id).isOnline;
    const defaultLocation = this.repository.getDefaultLocation();
    const tokenExpiration = this.repository.getAzureIntegration(id).tokenExpiration;
    this.repository.updateAzureIntegration(id, updateParams.alias, updateParams.tenantId, defaultLocation, isOnline, tokenExpiration);
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.logout(id);
    this.repository.deleteAzureIntegration(id);
  }

  getIntegration(integrationId: string): AzureIntegration {
    return this.repository.getAzureIntegration(integrationId);
  }

  getIntegrations(): AzureIntegration[] {
    return this.repository.listAzureIntegrations();
  }

  async setOnline(integration: AzureIntegration, forcedState?: boolean): Promise<void> {
    if (forcedState !== undefined) {
      integration.isOnline = forcedState;
    } else {
      const secret = await this.azurePersistenceService.getAzureSecrets(integration.id);
      const isAlreadyOnline = !!secret.profile && !!secret.account && !!secret.refreshToken;
      if (integration.isOnline && !isAlreadyOnline) {
        await this.logout(integration.id);
      }
      integration.isOnline = isAlreadyOnline;
    }
    this.repository.updateAzureIntegration(
      integration.id,
      integration.alias,
      integration.tenantId,
      integration.region,
      integration.isOnline,
      integration.tokenExpiration
    );
  }

  async logout(integrationId: string): Promise<void> {
    const integration = this.getIntegration(integrationId);
    if (integration.isOnline) {
      await this.azurePersistenceService.deleteAzureSecrets(integrationId);
    }

    await this.setOnline(integration, false);
    await this.deleteDependentSessions(integrationId);
    this.notifyIntegrationChanges();
  }

  remainingHours(_integration: Integration): string {
    // Todo: handle azure remaining time if necessary
    return "90 days";
  }

  async syncSessions(integrationId: string): Promise<any> {
    const integration = this.getIntegration(integrationId);
    try {
      // TODO: remove/clean msal_token_cache!!!
      await this.executeService.execute(`az login --tenant ${integration.tenantId} 2>&1`);
    } catch (err) {
      const errorObject = JSON.parse(JSON.stringify(err));
      if (
        errorObject.code === 1 &&
        !errorObject.killed &&
        errorObject.signal === null &&
        errorObject.stdout.indexOf("ERROR: No subscriptions found for") !== -1
      ) {
        await this.deleteDependentSessions(integrationId);
        // TODO: remove/clean msal_token_cache!!!
        throw new LoggedException(`No Azure Subscriptions found for integration: ${integration.alias}`, this, LogLevel.warn, true);
      }
      if (errorObject.code === null && errorObject.killed) {
        throw new LoggedException(`Timeout error during Azure login with integration: ${integration.alias}`, this, LogLevel.error, true);
      }
      throw new LoggedException(err.toString(), this, LogLevel.error, false);
    }
    const azureProfile = await this.azurePersistenceService.loadProfile();
    await this.moveSecretsToKeychain(integration, azureProfile);
    await this.setOnline(integration, true);
    this.notifyIntegrationChanges();

    // TODO: region is a parameter that is conceptually associated with the integration, not the session
    let sessionCreationRequests: AzureSessionRequest[] = azureProfile.subscriptions.map((sub) => ({
      region: integration.region,
      subscriptionId: sub.id,
      tenantId: integration.tenantId,
      sessionName: sub.name,
      azureIntegrationId: integrationId,
    }));

    const azureSessions = this.repository
      .getSessions()
      .filter((session) => session.type === SessionType.azure)
      .map((session) => session as AzureSession);

    for (const azureSession of azureSessions.filter(
      (session) => session.azureIntegrationId !== integrationId && session.status !== SessionStatus.inactive
    )) {
      await this.azureSessionService.stop(azureSession.sessionId);
    }

    let sessionsToDelete = 0;
    const integrationSessions = azureSessions.filter((session) => session.azureIntegrationId === integrationId);
    for (const azureSession of integrationSessions) {
      const creationRequest = sessionCreationRequests.find(
        (request) =>
          azureSession.sessionName === request.sessionName &&
          azureSession.tenantId === request.tenantId &&
          azureSession.subscriptionId === request.subscriptionId &&
          azureSession.region === request.region
      );
      const isSessionToDelete = creationRequest === undefined;
      if (isSessionToDelete) {
        sessionsToDelete++;
        await this.azureSessionService.delete(azureSession.sessionId);
      } else {
        if (azureSession.status !== SessionStatus.inactive) {
          await this.azureSessionService.stop(azureSession.sessionId);
          await this.azureSessionService.start(azureSession.sessionId);
        }
        sessionCreationRequests = sessionCreationRequests.filter((request) => request !== creationRequest);
      }
    }
    for (const creationRequest of sessionCreationRequests) {
      await this.azureSessionService.create(creationRequest);
    }

    return { sessionsAdded: sessionCreationRequests.length, sessionsDeleted: sessionsToDelete };
  }

  private notifyIntegrationChanges() {
    this.behaviouralNotifier.setIntegrations([...this.repository.listAwsSsoIntegrations(), ...this.repository.listAzureIntegrations()]);
  }

  private async moveSecretsToKeychain(integration: AzureIntegration, azureProfile: AzureProfile): Promise<void> {
    const msalTokenCache = await this.azurePersistenceService.loadMsalCache();
    const accessToken = Object.values(msalTokenCache.AccessToken).find((tokenObj) => tokenObj.realm === integration.tenantId);
    const accountEntry = Object.entries(msalTokenCache.Account).find((accountArr) => accountArr[1].home_account_id === accessToken.home_account_id);
    const refreshTokenEntry = Object.entries(msalTokenCache.RefreshToken).find(
      (refreshTokenArr) => refreshTokenArr[1].home_account_id === accessToken.home_account_id
    );
    await this.azurePersistenceService.setAzureSecrets(integration.id, {
      profile: azureProfile,
      account: accountEntry,
      refreshToken: refreshTokenEntry,
    });
    await this.executeService.execute("az logout");
  }

  private async deleteDependentSessions(integrationId: string): Promise<void> {
    const azureSessions = this.repository.getSessions().filter((session) => (session as any).azureIntegrationId === integrationId);
    for (const session of azureSessions) {
      await this.azureSessionService.delete(session.sessionId);
    }
  }
}
