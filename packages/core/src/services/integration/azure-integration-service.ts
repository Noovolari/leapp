import { IBehaviouralNotifier } from "../../interfaces/i-behavioural-notifier";
import { IIntegrationService } from "../../interfaces/i-integration-service";
import { INativeService } from "../../interfaces/i-native-service";
import { KeychainService } from "../keychain-service";
import { Repository } from "../repository";
import { SessionFactory } from "../session-factory";
import { Integration } from "../../models/integration";
import { AzureIntegration } from "../../models/azure/azure-integration";
import { ExecuteService } from "../execute-service";
import { AzurePersistenceService, AzureProfile } from "../azure-persistence-service";
import { LoggedException, LogLevel } from "../log-service";
import { AzureIntegrationCreationParams } from "../../models/azure/azure-integration-creation-params";
import { AzureSessionRequest } from "../session/azure/azure-session-request";
import { AzureService } from "../session/azure/azure-service";
import { SessionType } from "../../models/session-type";
import { AzureSession } from "../../models/azure/azure-session";
import { constants } from "../../models/constants";

export class AzureIntegrationService implements IIntegrationService {
  constructor(
    public repository: Repository,
    public keyChainService: KeychainService,
    public behaviouralNotifier: IBehaviouralNotifier,
    public nativeService: INativeService,
    public sessionFactory: SessionFactory,
    public executeService: ExecuteService,
    public azureService: AzureService,
    public azurePersistenceService: AzurePersistenceService
  ) {}

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

  async createIntegration(creationParams: AzureIntegrationCreationParams): Promise<void> {
    await this.checkCliVersion();
    const defaultLocation = this.repository.getDefaultLocation();
    this.repository.addAzureIntegration(creationParams.alias, creationParams.tenantId, defaultLocation);
  }

  updateIntegration(id: string, updateParams: AzureIntegrationCreationParams): void {
    const isOnline = this.repository.getAzureIntegration(id).isOnline;
    const defaultLocation = this.repository.getDefaultLocation();
    this.repository.updateAzureIntegration(id, updateParams.alias, updateParams.tenantId, defaultLocation, isOnline);
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
      const profile = await this.keyChainService.getSecret(constants.appName, this.getProfileKeychainKey(integration.id));
      const account = await this.keyChainService.getSecret(constants.appName, this.getAccountKeychainKey(integration.id));
      const refreshToken = await this.keyChainService.getSecret(constants.appName, this.getRefreshTokenKeychainKey(integration.id));
      integration.isOnline = !!profile && !!account && !!refreshToken;
    }
    this.repository.updateAzureIntegration(integration.id, integration.alias, integration.tenantId, integration.region, integration.isOnline);
  }

  async logout(integrationId: string): Promise<void> {
    const integration = this.getIntegration(integrationId);
    if (integration.isOnline) {
      this.keyChainService.deletePassword(constants.appName, this.getProfileKeychainKey(integrationId)).catch(() => {});
      this.keyChainService.deletePassword(constants.appName, this.getAccountKeychainKey(integrationId)).catch(() => {});
      this.keyChainService.deletePassword(constants.appName, this.getRefreshTokenKeychainKey(integrationId)).catch(() => {});
    }

    await this.setOnline(integration, false);
    this.deleteDependentSessions(integrationId);
    this.notifyIntegrationChanges();
  }

  remainingHours(_integration: Integration): string {
    // Todo: handle azure remaining time if necessary
    return "8hrs";
  }

  async syncSessions(integrationId: string): Promise<any> {
    const integration = this.getIntegration(integrationId);
    await this.executeService.execute(`az login --tenant ${integration.tenantId} 2>&1`);
    const azureProfile = await this.azurePersistenceService.loadProfile();
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
      .map((session) => session as AzureSession)
      .filter((session) => session.azureIntegrationId === integrationId);

    for (const azureSession of azureSessions) {
      const creationRequest = sessionCreationRequests.find(
        (request) =>
          azureSession.sessionName === request.sessionName &&
          azureSession.tenantId === request.tenantId &&
          azureSession.subscriptionId === request.subscriptionId &&
          azureSession.region === request.region
      );
      const isSessionToDelete = !creationRequest;
      if (isSessionToDelete) {
        await this.azureService.delete(azureSession.sessionId);
      } else {
        sessionCreationRequests = sessionCreationRequests.filter((request) => request !== creationRequest);
      }
    }
    for (const creationRequest of sessionCreationRequests) {
      await this.azureService.create(creationRequest);
    }
    await this.moveSecretsToKeychain(integration, azureProfile);
    await this.setOnline(integration, true);
    this.notifyIntegrationChanges();
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
    await this.keyChainService.saveSecret(constants.appName, this.getProfileKeychainKey(integration.id), JSON.stringify(azureProfile));
    await this.keyChainService.saveSecret(constants.appName, this.getAccountKeychainKey(integration.id), JSON.stringify(accountEntry));
    await this.keyChainService.saveSecret(constants.appName, this.getRefreshTokenKeychainKey(integration.id), JSON.stringify(refreshTokenEntry));
    await this.executeService.execute("az logout");
  }

  private getAccountKeychainKey(integrationId: string): string {
    return `azure-integration-account-${integrationId}`;
  }

  private getRefreshTokenKeychainKey(integrationId: string): string {
    return `azure-integration-refresh-token-${integrationId}`;
  }

  private getProfileKeychainKey(integrationId: string): string {
    return `azure-integration-profile-${integrationId}`;
  }

  private deleteDependentSessions(integrationId: string): void {
    const azureSessions = this.repository.getSessions().filter((session) => (session as any).azureIntegrationId === integrationId);
    for (const session of azureSessions) {
      this.repository.deleteSession(session.sessionId);
    }
    this.behaviouralNotifier.setSessions(this.repository.getSessions());
  }
}
