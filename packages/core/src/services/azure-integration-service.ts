import { IBehaviouralNotifier } from "../interfaces/i-behavioural-notifier";
import { IIntegrationService } from "../interfaces/i-integration-service";
import { INativeService } from "../interfaces/i-native-service";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { KeychainService } from "./keychain-service";
import { Repository } from "./repository";
import { SessionFactory } from "./session-factory";
import { IntegrationCreationParams } from "../interfaces/IIntegrationCreateParams";
import { Integration } from "../models/integration";
import { AzureIntegration } from "../models/azure-integration";

export class AzureIntegrationService implements IIntegrationService {
  constructor(
    public behaviouralSubjectService: BehaviouralSubjectService,
    public keyChainService: KeychainService,
    public nativeService: INativeService,
    public repository: Repository,
    public sessionFactory: SessionFactory,
    public sessionNotifier: IBehaviouralNotifier
  ) {}

  createIntegration(_creationParams: IntegrationCreationParams): void {}

  deleteIntegration(_integrationId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  getIntegration(_id: string): AzureIntegration {
    return undefined;
  }

  getIntegrations(): Integration[] {
    return [];
  }

  isOnline(_integration: Integration): boolean {
    return false;
  }

  logout(_integrationId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  remainingHours(_integration: Integration): string {
    return "";
  }

  syncSessions(_integrationId: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  updateAwsSsoIntegration(_id: string, _updateParams: IntegrationCreationParams): void {}
}
