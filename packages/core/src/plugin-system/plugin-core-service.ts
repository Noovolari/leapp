import { AwsCoreService } from "../services/aws-core-service";
import { ExecuteService } from "../services/execute-service";
import { AzureCoreService } from "../services/azure-core-service";
import { INativeService } from "../interfaces/i-native-service";
import { Repository } from "../services/repository";
import { TemplateOutputObject } from "./interfaces/IPlugin";

export class PluginCoreService {
  outputType = TemplateOutputObject;

  constructor(
    private executeService: ExecuteService,
    private nativeService: INativeService,
    private repositoryService: Repository,
    private awsCoreService: AwsCoreService,
    private azureCoreService: AzureCoreService
  ) {}
}
