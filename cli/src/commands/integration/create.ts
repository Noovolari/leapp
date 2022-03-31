import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AwsSsoIntegrationService, IntegrationCreationParams } from "@noovolari/leapp-core/services/aws-sso-integration-service";

export default class CreateSsoIntegration extends LeappCommand {
  static description = "Create a new AWS SSO integration";
  static examples = ["$leapp integration create"];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const creationParams = await this.askConfigurationParameters();
      await this.createIntegration(creationParams);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async askConfigurationParameters(): Promise<IntegrationCreationParams> {
    const creationParams = { browserOpening: constants.inBrowser } as IntegrationCreationParams;
    const aliasAnswer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedAlias",
        message: "Insert an alias",
        validate: AwsSsoIntegrationService.validateAlias,
        type: "input",
      },
    ]);
    creationParams.alias = aliasAnswer.selectedAlias;

    const portalUrlAnswer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedPortalUrl",
        message: "Insert a portal URL",
        validate: AwsSsoIntegrationService.validatePortalUrl,
        type: "input",
      },
    ]);
    creationParams.portalUrl = portalUrlAnswer.selectedPortalUrl;

    const awsRegions = this.cliProviderService.cloudProviderService.availableRegions(SessionType.aws);
    const regionAnswer = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedRegion",
        message: "Select a region",
        type: "list",
        choices: awsRegions.map((region) => ({ name: region.fieldName, value: region.fieldValue })),
      },
    ]);
    creationParams.region = regionAnswer.selectedRegion;

    return creationParams;
  }

  async createIntegration(creationParams: IntegrationCreationParams): Promise<void> {
    await this.cliProviderService.awsSsoIntegrationService.createIntegration(creationParams);
    await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
    this.log("aws sso integration created");
  }
}
