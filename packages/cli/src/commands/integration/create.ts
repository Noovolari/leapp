import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { integrationAlias, integrationMethod, integrationPortalUrl, integrationRegion } from "../../flags";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import { IntegrationMethod } from "@noovolari/leapp-core/models/integration-method";
import { IntegrationParams } from "@noovolari/leapp-core/models/integration-params";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";

export default class CreateSsoIntegration extends LeappCommand {
  static description = "Create a new integration";
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
      let creationParams: IntegrationParams;
      let integrationType: IntegrationType;
      const { flags } = await this.parse(CreateSsoIntegration);
      if (LeappCommand.areFlagsNotDefined(flags, this)) {
        const method = await this.chooseIntegrationMethod();
        integrationType = method.integrationType;
        creationParams = await this.askConfigurationParameters(method);
      } else {
        // TODO: add proper flags!
        integrationType = IntegrationType.awsSso;
        creationParams = this.validateAndAssignFlags(flags);
      }
      await this.createIntegration(integrationType, creationParams);
    } catch (error: any) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async chooseIntegrationMethod(): Promise<IntegrationMethod> {
    const integrationMethods = this.cliProviderService.cloudProviderService.creatableIntegrationMethods();
    const accessMethodAnswer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedMethod",
        message: "select an integration method",
        type: "list",
        choices: integrationMethods.map((method: any) => ({ name: method.alias, value: method })),
      },
    ]);
    return accessMethodAnswer.selectedMethod;
  }

  async askConfigurationParameters(chosenIntegrationMethod: IntegrationMethod): Promise<IntegrationParams> {
    const integrationParams = {} as any;
    for (const field of chosenIntegrationMethod.integrationMethodFields) {
      const fieldAnswer: any = await this.cliProviderService.inquirer.prompt([
        {
          name: field.creationRequestField,
          message: field.message,
          type: field.type,
          choices: field.choices?.map((choice: any) => ({ name: choice.fieldName, value: choice.fieldValue })),
          validate: field.fieldValidator,
        },
      ]);
      integrationParams[field.creationRequestField] = fieldAnswer[field.creationRequestField];
    }
    return integrationParams;
  }

  async createIntegration(integrationType: IntegrationType, integrationParams: IntegrationParams): Promise<void> {
    await this.cliProviderService.integrationFactory.create(integrationType, integrationParams);
    await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
    this.log("integration created");
  }

  private validateAndAssignFlags(flags: any): AwsSsoIntegration {
    if (
      flags.integrationAlias === undefined ||
      flags.integrationPortalUrl === undefined ||
      flags.integrationRegion === undefined ||
      flags.integrationMethod === undefined
    ) {
      throw new Error(
        `missing values for flags: ${[
          flags.integrationAlias ? "" : "--integrationAlias",
          flags.integrationPortalUrl ? "" : "--integrationPortalUrl",
          flags.integrationRegion ? "" : "--integrationRegion",
          flags.integrationMethod ? "" : "--integrationMethod",
        ]
          .filter((el) => el !== "")
          .join(", ")}`
      );
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
