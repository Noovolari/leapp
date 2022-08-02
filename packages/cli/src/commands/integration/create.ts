import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AwsSsoIntegrationService } from "@noovolari/leapp-core/services/integration/aws-sso-integration-service";
import { integrationAlias, integrationMethod, integrationPortalUrl, integrationRegion } from "../../flags";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";

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

  private static areFlagsNotDefined(flags: any): boolean {
    return (
      flags.integrationAlias === undefined &&
      flags.integrationRegion === undefined &&
      flags.integrationPortalUrl === undefined &&
      flags.integrationMethod === undefined
    );
  }

  async run(): Promise<void> {
    try {
      let creationParams: AwsSsoIntegration;
      const { flags } = await this.parse(CreateSsoIntegration);
      if (CreateSsoIntegration.areFlagsNotDefined(flags)) {
        creationParams = await this.askConfigurationParameters();
      } else {
        creationParams = this.validateAndAssignFlags(flags);
      }
      await this.createIntegration(creationParams);
    } catch (error: any) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async askConfigurationParameters(): Promise<AwsSsoIntegration> {
    const creationParams = { browserOpening: constants.inBrowser } as AwsSsoIntegration;
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
        choices: awsRegions.map((region: { fieldName: any; fieldValue: any }) => ({ name: region.fieldName, value: region.fieldValue })),
      },
    ]);
    creationParams.region = regionAnswer.selectedRegion;

    return creationParams;
  }

  async createIntegration(creationParams: AwsSsoIntegration): Promise<void> {
    await this.cliProviderService.awsSsoIntegrationService.createIntegration(creationParams);
    await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
    this.log("aws sso integration created");
  }

  private validateAndAssignFlags(flags: any): AwsSsoIntegration {
    if (
      flags.integrationAlias === undefined ||
      flags.integrationPortalUrl === undefined ||
      flags.integrationRegion === undefined ||
      flags.integrationMethod === undefined
    ) {
      throw new Error("flags --integrationAlias, --integrationPortalUrl, --integrationRegion and --integrationMethod must all be specified");
    }
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
        .map((r: { region: any }) => r.region)
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
    } as AwsSsoIntegration;
  }
}
