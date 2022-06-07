import { IBehaviouralNotifier } from "../../interfaces/i-behavioural-notifier";
import { IIntegrationService } from "../../interfaces/i-integration-service";
import { INativeService } from "../../interfaces/i-native-service";
import { BehaviouralSubjectService } from "../behavioural-subject-service";
import { KeychainService } from "../keychain-service";
import { Repository } from "../repository";
import { SessionFactory } from "../session-factory";
import { Integration } from "../../models/integration";
import { AzureIntegration } from "../../models/azure-integration";
import { ExecuteService } from "../execute-service";

export class AzureIntegrationService implements IIntegrationService {
  constructor(
    public behaviouralSubjectService: BehaviouralSubjectService,
    public keyChainService: KeychainService,
    public nativeService: INativeService,
    public repository: Repository,
    public sessionFactory: SessionFactory,
    public sessionNotifier: IBehaviouralNotifier,
    public executeService: ExecuteService
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

  getIntegrations(): Integration[] {
    return [];
  }

  isOnline(_integration: Integration): boolean {
    return false;
  }

  async logout(_integrationId: string): Promise<void> {
    this.executeService.execute("az logout");
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
    this.behaviouralSubjectService.setSessions([...this.repository.getSessions()]);
  }
}
