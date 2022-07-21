import { AwsCoreService } from "../services/aws-core-service";
import { ExecuteService } from "../services/execute-service";
import { AzureCoreService } from "../services/azure-core-service";
import { INativeService } from "../interfaces/i-native-service";
import { Repository } from "../services/repository";
import { TemplateOutputObject } from "./interfaces/i-plugin";
import { SessionFactory } from "../services/session-factory";
import { OperatingSystem } from "../models/operating-system";

export class PluginCoreService {
  outputType = TemplateOutputObject;
  operatingSystem = OperatingSystem;

  constructor(
    public executeService: ExecuteService,
    public nativeService: INativeService,
    public repositoryService: Repository,
    public awsCoreService: AwsCoreService,
    public azureCoreService: AzureCoreService,
    public sessionFactory: SessionFactory
  ) {}
}
