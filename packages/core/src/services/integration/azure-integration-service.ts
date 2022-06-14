import { IBehaviouralNotifier } from "../../interfaces/i-behavioural-notifier";
import { IIntegrationService } from "../../interfaces/i-integration-service";
import { INativeService } from "../../interfaces/i-native-service";
import { KeychainService } from "../keychain-service";
import { Repository } from "../repository";
import { SessionFactory } from "../session-factory";
import { Integration } from "../../models/integration";
import { AzureIntegration } from "../../models/azure/azure-integration";
import { ExecuteService } from "../execute-service";
import { MsalPersistenceService } from "../msal-persistence-service";

export class AzureIntegrationService implements IIntegrationService {
  constructor(
    public repository: Repository,
    public keyChainService: KeychainService,
    public behaviouralNotifier: IBehaviouralNotifier,
    public nativeService: INativeService,
    public sessionFactory: SessionFactory,
    public executeService: ExecuteService,
    public msalPersistenceService: MsalPersistenceService
  ) {}

  createIntegration(creationParams: AzureIntegration): void {
    this.repository.addAzureIntegration(creationParams.alias, creationParams.tenantId);
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    await this.logout(integrationId);
    this.repository.deleteAzureIntegration(integrationId);
    this.deleteDependentSessions(integrationId);
  }

  getIntegration(integrationId: string): AzureIntegration {
    return this.repository.getAzureIntegration(integrationId);
  }

  getIntegrations(): AzureIntegration[] {
    return this.repository.listAzureIntegrations();
  }

  async setOnline(integration: AzureIntegration, forcedState?: boolean): Promise<void> {
    let isOnline: boolean;

    try {
      const msalTokenCache = await this.msalPersistenceService.load();
      const azureProfile = await this.msalPersistenceService.loadAzureProfile();

      let accessTokensBoundToTheSameTenant = true;
      let idTokensBoundToTheSameTenant = true;
      let subscriptionsBoundToTheSameTenant = true;

      const accessTokenKeys = Object.keys(msalTokenCache.AccessToken);
      for (const accessTokenKey of accessTokenKeys) {
        accessTokensBoundToTheSameTenant &&= accessTokenKey.indexOf(integration.tenantId) > -1;
      }

      const idTokenKeys = Object.keys(msalTokenCache.IdToken);
      for (const idTokenKey of idTokenKeys) {
        idTokensBoundToTheSameTenant &&= idTokenKey.indexOf(integration.tenantId) > -1;
      }

      const subscriptions = azureProfile.subscriptions;
      for (const subscription of subscriptions) {
        subscriptionsBoundToTheSameTenant &&= subscription.tenantId === integration.tenantId;
      }

      isOnline = accessTokensBoundToTheSameTenant && idTokensBoundToTheSameTenant && subscriptionsBoundToTheSameTenant;
    } catch (err) {
      isOnline = false;
    }

    integration.isOnline = forcedState || isOnline;

    this.repository.updateAzureIntegration(integration.id, integration.alias, integration.tenantId, integration.isOnline);
  }

  async logout(integrationId: string): Promise<void> {
    this.executeService.execute("az logout");
    const integration = this.getIntegration(integrationId);
    this.setOnline(integration, false);
    this.behaviouralNotifier.setIntegrations([...this.repository.listAwsSsoIntegrations(), ...this.repository.listAzureIntegrations()]);
  }

  remainingHours(_integration: Integration): string {
    return "";
  }

  syncSessions(_integrationId: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  updateAwsSsoIntegration(_id: string, _updateParams: Integration): void {}

  private deleteDependentSessions(integrationId: string) {
    const azureSessions = this.repository.getSessions().filter((session) => (session as any).azureIntegrationId === integrationId);
    for (const session of azureSessions) {
      this.repository.deleteSession(session.sessionId);
    }
    this.behaviouralNotifier.setSessions([...this.repository.getSessions()]);
  }
}
