import { Repository } from "../services/repository";
import { KeychainService } from "../services/keychain-service";
import { IBehaviouralNotifier } from "./i-behavioural-notifier";
import { INativeService } from "./i-native-service";
import { SessionFactory } from "../services/session-factory";
import { BehaviouralSubjectService } from "../services/behavioural-subject-service";
import { IntegrationCreationParams } from "./IIntegrationCreateParams";
import { Integration } from "../models/integration";

export interface IIntegrationService {
  repository: Repository;
  keyChainService: KeychainService;
  sessionNotifier: IBehaviouralNotifier;
  nativeService: INativeService;
  sessionFactory: SessionFactory;
  behaviouralSubjectService: BehaviouralSubjectService;

  createIntegration(creationParams: IntegrationCreationParams): void;

  updateAwsSsoIntegration(id: string, updateParams: IntegrationCreationParams): void;

  getIntegration(id: string): Integration;

  getIntegrations(): Integration[];

  isOnline(integration: Integration): boolean;

  remainingHours(integration: Integration): string;

  syncSessions(integrationId: string): Promise<any>;

  logout(integrationId: string): Promise<void>;

  deleteIntegration(integrationId: string): Promise<void>;
}
