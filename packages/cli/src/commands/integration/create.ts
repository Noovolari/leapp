import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AwsSsoIntegrationService, IntegrationCreationParams } from "@noovolari/leapp-core/services/aws-sso-integration-service";
import { integrationAlias, integrationMethod, integrationPortalUrl, integrationRegion } from "../../flags";

export default class CreateSsoIntegration extends LeappCommand {
  static description = "Create a new AWS SSO integration";
  static examples = [
    "$leapp integration create",
    "$leapp integration create --integrationAlias ALIAS --integrationPortalUrl URL --integrationRegion REGION --integrationMethod [In-app, In-browser]",
  ];

  static flags = {
    integrationAlias,
    integrationPortalUrl,
    integrationRegion,
    integrationMethod,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      let creationParams: IntegrationCreationParams;
      const { flags } = await this.parse(CreateSsoIntegration);
      if (this.checkFlags(flags)) {
        creationParams = this.validateAndAssignFlags(flags);
      } else {
        creationParams = await this.askConfigurationParameters();
      }
      await this.createIntegration(creationParams);
    } catch (error: any) {
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

  private checkFlags(flags: any): boolean {
    return (
      flags.integrationAlias !== undefined &&
      flags.integrationRegion !== undefined &&
      flags.integrationPortalUrl !== undefined &&
      flags.integrationMethod !== undefined
    );
  }

  private validateAndAssignFlags(flags: any): IntegrationCreationParams {
    if (flags.integrationAlias === "") {
      throw new Error("Alias must not be empty");
    }
    if (flags.integrationPortalUrl === "") {
      throw new Error("Portal URL must not be empty");
    }
    if (flags.integrationPortalUrl.indexOf("http://") < 0 && flags.integrationPortalUrl.indexOf("https://")) {
      throw new Error("Portal URL is not valid");
    }
    if (flags.integrationRegion === "") {
      throw new Error("AWS Region must not be empty");
    }
    if (
      this.cliProviderService.awsCoreService
        .getRegions()
        .map((r) => r.region)
        .indexOf(flags.integrationRegion) < 0
    ) {
      throw new Error("Provided region is not a valid AWS region");
    }
    if (flags.integrationMethod.indexOf("In-app") < 0 && flags.integrationMethod.indexOf("In-browser") < 0) {
      throw new Error("Provided method is not a valid integration method. Please use either In-app or In-browser");
    }

    return {
      portalUrl: flags.integrationPortalUrl,
      alias: flags.integrationAlias,
      browserOpening: flags.integrationMethod,
      region: flags.integrationRegion,
    };
  }
}
