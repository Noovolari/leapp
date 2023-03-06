import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import {
  integrationAlias,
  integrationLocation,
  integrationPortalUrl,
  integrationRegion,
  integrationType,
  integrationTenantId,
  trustCertificate,
} from "../../flags";
import { IntegrationMethod } from "@noovolari/leapp-core/models/integration-method";
import { IntegrationParams } from "@noovolari/leapp-core/models/integration-params";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AzureIntegrationCreationParams } from "@noovolari/leapp-core/models/azure/azure-integration-creation-params";
import { AwsSsoIntegrationCreationParams } from "@noovolari/leapp-core/models/aws/aws-sso-integration-creation-params";

export default class CreateSsoIntegration extends LeappCommand {
  static description = "Create a new integration";
  static examples = [
    "$leapp integration create",
    `$leapp integration create --integrationType ${IntegrationType.awsSso} --integrationAlias ALIAS` +
      ` --integrationPortalUrl URL --integrationRegion REGION`,
    `$leapp integration create --integrationType ${IntegrationType.azure} --integrationAlias ALIAS` +
      ` --integrationTenantId TENANT --integrationLocation LOCATION`,
  ];

  static flags = {
    integrationAlias,
    integrationPortalUrl,
    integrationRegion,
    integrationType,
    integrationTenantId,
    integrationLocation,
    trustCertificate,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      let creationParams: IntegrationParams;
      let type: IntegrationType;
      const { flags } = await this.parse(CreateSsoIntegration);
      if (
        LeappCommand.areFlagsNotDefined(
          {
            integrationAlias: flags.integrationAlias,
            integrationPortalUrl: flags.integrationPortalUrl,
            integrationRegion: flags.integrationRegion,
            integrationType: flags.integrationType,
            integrationTenantId: flags.integrationTenantId,
            integrationLocation: flags.integrationLocation,
          },
          this
        )
      ) {
        const method = await this.chooseIntegrationMethod();
        type = method.integrationType;
        creationParams = await this.askConfigurationParameters(method);
      } else {
        creationParams = this.verifyAndExtractFlags(flags);
        type = flags.integrationType as any;
      }
      await this.createIntegration(type, creationParams);
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
    if (chosenIntegrationMethod.integrationType === IntegrationType.awsSso) {
      integrationParams.browserOpening = constants.inBrowser;
      integrationParams.trustSystemCA = integrationParams.trustSystemCA === "true";
    }
    return integrationParams;
  }

  async createIntegration(integType: IntegrationType, integrationParams: IntegrationParams): Promise<void> {
    await this.cliProviderService.integrationFactory.create(integType, integrationParams);
    await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
    this.log("integration created");
  }

  private verifyAndExtractFlags(flags: any): IntegrationParams {
    if (flags.integrationType === undefined) {
      throw new Error("flags --integrationType must always be specified");
    }
    const method = this.cliProviderService.cloudProviderService
      .creatableIntegrationMethods()
      .find((m: any) => m.integrationType === flags.integrationType);
    if (method === undefined) {
      throw new Error(`invalid integration type value. Valid values are: [${IntegrationType.awsSso}, ${IntegrationType.azure}]`);
    }
    switch (flags.integrationType) {
      case IntegrationType.awsSso:
        if (flags.integrationAlias === undefined || flags.integrationPortalUrl === undefined || flags.integrationRegion === undefined) {
          throw new Error(
            `missing values for flags: ${[
              flags.integrationAlias ? "" : "--integrationAlias",
              flags.integrationPortalUrl ? "" : "--integrationPortalUrl",
              flags.integrationRegion ? "" : "--integrationRegion",
            ]
              .filter((el) => el !== "")
              .join(", ")}`
          );
        }
        const awsAliasValidator = (method.integrationMethodFields.find((field: any) => field.creationRequestField === "alias") as any).fieldValidator;
        const portalUrlValidator = (method.integrationMethodFields.find((field: any) => field.creationRequestField === "portalUrl") as any)
          .fieldValidator;
        const aliasValidation = awsAliasValidator(flags.integrationAlias);
        if (typeof aliasValidation === "string") {
          throw new Error(aliasValidation);
        }
        const portalUrlValidation = portalUrlValidator(flags.integrationPortalUrl);
        if (typeof portalUrlValidation === "string") {
          throw new Error(portalUrlValidation);
        }
        if (flags.integrationRegion === "") {
          throw new Error("AWS Region must not be empty");
        }
        if (!this.cliProviderService.awsCoreService.getRegions().find((region: any) => region.region === flags.integrationRegion)) {
          throw new Error("Provided region is not a valid AWS region");
        }
        return {
          portalUrl: flags.integrationPortalUrl,
          alias: flags.integrationAlias,
          browserOpening: constants.inBrowser,
          region: flags.integrationRegion,
          trustSystemCA: flags.trustCertificate,
        } as AwsSsoIntegrationCreationParams;
      case IntegrationType.azure:
        if (flags.integrationAlias === undefined || flags.integrationTenantId === undefined || flags.integrationLocation === undefined) {
          throw new Error(
            `missing values for flags: ${[
              flags.integrationAlias ? "" : "--integrationAlias",
              flags.integrationTenantId ? "" : "--integrationTenantId",
              flags.integrationLocation ? "" : "--integrationLocation",
            ]
              .filter((el) => el !== "")
              .join(", ")}`
          );
        }
        const azureAliasValidator = (method.integrationMethodFields.find((field: any) => field.creationRequestField === "alias") as any)
          .fieldValidator;
        const tenantIdValidator = (method.integrationMethodFields.find((field: any) => field.creationRequestField === "tenantId") as any)
          .fieldValidator;
        const azureAliasValidation = azureAliasValidator(flags.integrationAlias);
        if (typeof azureAliasValidation === "string") {
          throw new Error(azureAliasValidation);
        }
        const tenantIdValidation = tenantIdValidator(flags.integrationTenantId);
        if (typeof tenantIdValidation === "string") {
          throw new Error(tenantIdValidation);
        }
        if (flags.integrationLocation === "") {
          throw new Error("Azure Location must not be empty");
        }
        if (!this.cliProviderService.azureCoreService.getLocations().find((location: any) => location.location === flags.integrationLocation)) {
          throw new Error("Provided location is not a valid Azure location");
        }
        return {
          alias: flags.integrationAlias,
          tenantId: flags.integrationTenantId,
          location: flags.integrationLocation,
        } as AzureIntegrationCreationParams;
    }
    return undefined as any;
  }
}
