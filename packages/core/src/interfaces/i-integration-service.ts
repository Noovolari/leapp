import { Repository } from "../services/repository";
import { KeychainService } from "../services/keychain-service";
import { IBehaviouralNotifier } from "./i-behavioural-notifier";
import { INativeService } from "./i-native-service";
import { SessionFactory } from "../services/session-factory";
import { BehaviouralSubjectService } from "../services/behavioural-subject-service";
import { Integration } from "../models/integration";

export interface IIntegrationService {
  repository: Repository;
  keyChainService: KeychainService;
  sessionNotifier: IBehaviouralNotifier;
  nativeService: INativeService;
  sessionFactory: SessionFactory;
  behaviouralSubjectService: BehaviouralSubjectService;

  createIntegration(creationParams: Integration): void;

  updateAwsSsoIntegration(id: string, updateParams: Integration): void;

  getIntegration(id: string): Integration;

  getIntegrations(): Integration[];

  isOnline(integration: Integration): Promise<boolean>;

  remainingHours(integration: Integration): string;

  syncSessions(integrationId: string): Promise<any>;

  logout(integrationId: string): Promise<void>;

  deleteIntegration(integrationId: string): Promise<void>;
}
