import { Repository } from "../services/repository";
import { IBehaviouralNotifier } from "./i-behavioural-notifier";
import { INativeService } from "./i-native-service";
import { SessionFactory } from "../services/session-factory";
import { Integration } from "../models/integration";
import { IntegrationParams } from "../models/integration-params";

export interface IIntegrationService {
  repository: Repository;
  behaviouralNotifier: IBehaviouralNotifier;
  nativeService: INativeService;
  sessionFactory: SessionFactory;

  createIntegration(creationParams: IntegrationParams): Promise<void>;

  updateIntegration(id: string, updateParams: IntegrationParams): void;

  getIntegration(id: string): Integration;

  getIntegrations(): Integration[];

  setOnline(integration: Integration): Promise<void>;

  remainingHours(integration: Integration): string;

  syncSessions(integrationId: string): Promise<any>;

  logout(integrationId: string): Promise<void>;

  deleteIntegration(integrationId: string): Promise<void>;
}
