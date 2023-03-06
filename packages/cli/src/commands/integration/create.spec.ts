import { jest, describe, test, expect } from "@jest/globals";
import CreateSsoIntegration from "./create";
import { AwsSsoIntegrationService } from "@noovolari/leapp-core/services/integration/aws-sso-integration-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { CliProviderService } from "../../service/cli-provider-service";
import { IntegrationMethod } from "@noovolari/leapp-core/models/integration-method";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { AccessMethodField } from "@noovolari/leapp-core/models/access-method-field";
import { AccessMethodFieldType } from "@noovolari/leapp-core/models/access-method-field-type";

describe("CreateSsoIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): CreateSsoIntegration => {
    const command = new CreateSsoIntegration(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("verifyAndExtractFlags - Unsupported integration type", () => {
    const cliProviderService = {
      cloudProviderService: {
        creatableIntegrationMethods: () => ({
          find: () => undefined,
        }),
      },
    } as any;

    const command = getTestCommand(cliProviderService, ["--integrationType", "wrong-integration-type"]);

    try {
      (command as any).verifyAndExtractFlags({ integrationType: "wrong-integration-type" });
    } catch (error) {
      expect(error).toStrictEqual(
        new Error(`invalid integration type value. Valid values are: [${IntegrationType.awsSso}, ${IntegrationType.azure}]`)
      );
    }

    const cliProviderService2 = {
      cloudProviderService: {
        creatableIntegrationMethods: () => ({
          find: () => "unsupported",
        }),
      },
    } as any;
    const command2 = getTestCommand(cliProviderService2, ["--integrationType", "unsupported"]);
    const result = (command2 as any).verifyAndExtractFlags({ integrationType: "unsupported" });
    expect(result).toBeUndefined();
  });

  test("AWS SSO Flags - Validation and Existance", async () => {
    const command1 = getTestCommand(new CliProviderService(), ["--integrationType", "AWS-SSO", "--integrationAlias", "test"]);
    const command2 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "test",
      "--integrationPortalUrl",
      "test",
    ]);
    const command3 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "test",
      "--integrationPortalUrl",
      "test",
      "--integrationRegion",
      "test",
    ]);

    const mock1 = jest.fn(() =>
      Promise.resolve({
        alias: "testAlias1",
        region: "eu-west-1",
        browserOpening: "In-app",
        portalUrl: "https://test",
      })
    );

    const mock2 = jest.fn((_: any) => Promise.resolve());

    command1.createIntegration = mock2;
    (command1 as any).askConfigurationParameters = mock1;
    command2.createIntegration = mock2;
    (command2 as any).askConfigurationParameters = mock1;
    command3.createIntegration = mock2;
    (command3 as any).askConfigurationParameters = mock1;

    await expect(command1.run()).rejects.toThrowError("missing values for flags: --integrationPortalUrl, --integrationRegion");
    await expect(command2.run()).rejects.toThrowError("missing values for flags: --integrationRegion");
    await expect(command3.run()).rejects.toThrowError("--integrationType must always be specified");

    const command5 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "",
      "--integrationRegion",
      "",
    ]);
    command5.createIntegration = mock2;
    await expect(command5.run()).rejects.toThrowError("Invalid portal URL");

    const command6 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "ciao",
      "--integrationRegion",
      "",
    ]);
    command6.createIntegration = mock2;
    await expect(command6.run()).rejects.toThrowError("Invalid portal URL");

    const command7 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "https://www.google.com",
      "--integrationRegion",
      "ciao",
    ]);
    command7.createIntegration = mock2;
    await expect(command7.run()).rejects.toThrowError("Provided region is not a valid AWS region");

    const command8 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "",
      "--integrationPortalUrl",
      "https://www.google.it",
      "--integrationRegion",
      "eu-west-1",
    ]);
    command8.createIntegration = mock2;
    await expect(command8.run()).rejects.toThrowError("Empty alias");

    const command9 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "test",
      "--integrationPortalUrl",
      "https://www.google.it",
      "--integrationRegion",
      "",
    ]);
    command9.createIntegration = mock2;
    await expect(command9.run()).rejects.toThrowError("AWS Region must not be empty");

    const command10 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AWS-SSO",
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "https://www.google.it",
      "--integrationRegion",
      "eu-west-1",
    ]);
    const mock3 = jest.fn((_: any) => Promise.resolve());
    command10.createIntegration = mock3;
    await command10.run();
    expect(mock3).toHaveBeenCalledWith("AWS-SSO", {
      alias: "Alias",
      portalUrl: "https://www.google.it",
      region: "eu-west-1",
      browserOpening: constants.inBrowser,
      trustSystemCA: false,
    });
  });

  test("Azure Flags - Validation and Existance", async () => {
    const command1 = getTestCommand(new CliProviderService(), ["--integrationType", "AZURE", "--integrationAlias", "test-azure"]);
    const command2 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AZURE",
      "--integrationAlias",
      "test",
      "--integrationTenantId",
      "test",
    ]);
    const command3 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "test",
      "--integrationTenantId",
      "test",
      "--integrationLocation",
      "test",
    ]);

    const mock1 = jest.fn(() =>
      Promise.resolve({
        alias: "testAlias1",
        tenantId: "test",
        location: "eastus",
      })
    );

    const mock2 = jest.fn((_: any) => Promise.resolve());

    command1.createIntegration = mock2;
    (command1 as any).askConfigurationParameters = mock1;
    command2.createIntegration = mock2;
    (command2 as any).askConfigurationParameters = mock1;
    command3.createIntegration = mock2;
    (command3 as any).askConfigurationParameters = mock1;

    await expect(command1.run()).rejects.toThrowError("missing values for flags: --integrationTenantId, --integrationLocation");
    await expect(command2.run()).rejects.toThrowError("missing values for flags: --integrationLocation");
    await expect(command3.run()).rejects.toThrowError("--integrationType must always be specified");

    const command5 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AZURE",
      "--integrationAlias",
      "Alias",
      "--integrationTenantId",
      "",
      "--integrationLocation",
      "",
    ]);
    command5.createIntegration = mock2;
    await expect(command5.run()).rejects.toThrowError("Empty tenant id");

    const command6 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AZURE",
      "--integrationAlias",
      "Alias",
      "--integrationTenantId",
      "ciao",
      "--integrationLocation",
      "",
    ]);
    command6.createIntegration = mock2;
    await expect(command6.run()).rejects.toThrowError("Azure Location must not be empty");

    const command7 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AZURE",
      "--integrationAlias",
      "Alias",
      "--integrationTenantId",
      "tenant-id",
      "--integrationLocation",
      "wrong-location",
    ]);
    command7.createIntegration = mock2;
    await expect(command7.run()).rejects.toThrowError("Provided location is not a valid Azure location");

    const command8 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AZURE",
      "--integrationAlias",
      "",
      "--integrationTenantId",
      "tenant-id",
      "--integrationLocation",
      "wrong-location",
    ]);
    command8.createIntegration = mock2;
    await expect(command8.run()).rejects.toThrowError("Empty alias");

    const command9 = getTestCommand(new CliProviderService(), [
      "--integrationType",
      "AZURE",
      "--integrationAlias",
      "Alias",
      "--integrationTenantId",
      "fake-tenant-id",
      "--integrationLocation",
      "eastus",
    ]);
    const mock3 = jest.fn((_: any) => Promise.resolve());
    command9.createIntegration = mock3;
    await command9.run();
    expect(mock3).toHaveBeenCalledWith("AZURE", {
      alias: "Alias",
      tenantId: "fake-tenant-id",
      location: "eastus",
    });
  });

  test("askConfigurationParameters - AWS SSO", async () => {
    const cliProviderService = {
      inquirer: {
        prompt: jest.fn(async (questions) => {
          if (questions[0].name === "alias") {
            return { alias: "alias" };
          } else if (questions[0].name === "portalUrl") {
            return { portalUrl: "portalUrl" };
          } else if (questions[0].name === "region") {
            return { region: "region" };
          }
        }),
      },
      cloudProviderService: {
        availableRegions: jest.fn(() => [
          {
            fieldName: "nameRegion1",
            fieldValue: "valueRegion1",
          },
        ]),
      },
    } as any;
    const command = getTestCommand(cliProviderService);
    const actualCreationParams = await command.askConfigurationParameters(
      new IntegrationMethod(IntegrationType.awsSso, "AWS Single Sign-On", [
        new AccessMethodField("alias", "Insert integration alias", AccessMethodFieldType.input, undefined, AwsSsoIntegrationService.validateAlias),
        new AccessMethodField(
          "portalUrl",
          "Insert the portal url",
          AccessMethodFieldType.input,
          undefined,
          AwsSsoIntegrationService.validatePortalUrl
        ),
        new AccessMethodField("region", "Select region", AccessMethodFieldType.list, [{ fieldName: "a", fieldValue: "region-a" }]),
      ])
    );

    expect(cliProviderService.inquirer.prompt).toHaveBeenNthCalledWith(1, [
      {
        name: "alias",
        message: "Insert integration alias",
        validate: AwsSsoIntegrationService.validateAlias,
        type: "input",
        choices: undefined,
      },
    ]);

    expect(cliProviderService.inquirer.prompt).toHaveBeenNthCalledWith(2, [
      {
        name: "portalUrl",
        message: "Insert the portal url",
        validate: AwsSsoIntegrationService.validatePortalUrl,
        type: "input",
        choices: undefined,
      },
    ]);

    expect(cliProviderService.inquirer.prompt).toHaveBeenNthCalledWith(3, [
      {
        name: "region",
        message: "Select region",
        type: "list",
        choices: [
          {
            name: "a",
            value: "region-a",
          },
        ],
      },
    ]);

    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledTimes(3);
    expect(actualCreationParams).toEqual({
      browserOpening: constants.inBrowser,
      alias: "alias",
      portalUrl: "portalUrl",
      region: "region",
      trustSystemCA: false,
    });
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const configurationParams = { param1: "param1" };

    const method = { integrationType: "fake-integration-type" };
    const command = getTestCommand();
    command.chooseIntegrationMethod = jest.fn(async (): Promise<any> => method);
    command.askConfigurationParameters = jest.fn(async (): Promise<any> => configurationParams);
    command.createIntegration = jest.fn(async () => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    let occurredError;
    try {
      await command.run();
    } catch (error) {
      occurredError = error;
    }

    expect(command.chooseIntegrationMethod).toHaveBeenCalled();
    expect(command.askConfigurationParameters).toHaveBeenCalledWith(method);
    expect(command.createIntegration).toHaveBeenCalledWith(method.integrationType, configurationParams);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - createIntegration throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createIntegration throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });

  test("createIntegration", async () => {
    const cliProviderService = {
      remoteProceduresClient: {
        refreshIntegrations: jest.fn(),
      },
      integrationFactory: {
        create: jest.fn(),
      },
    } as any;

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    const creationParam: any = {
      alias: "alias",
      portalUrl: "portalUrl",
      region: "region",
      browserOpening: "browserOpening",
    };
    await command.createIntegration("AWS-SSO" as any, creationParam);

    expect(cliProviderService.integrationFactory.create).toBeCalledWith("AWS-SSO" as any, creationParam);
    expect(command.log).toHaveBeenCalledWith("integration created");
    expect(cliProviderService.remoteProceduresClient.refreshIntegrations).toHaveBeenCalled();
  });

  test("chooseIntegrationMethod", async () => {
    const integrationMethods = [{ alias: "alias-1" }, { alias: "alias-2" }];
    const cliProviderService = {
      inquirer: {
        prompt: jest.fn(async () => ({ selectedMethod: "selected-method" })),
      },
      cloudProviderService: {
        creatableIntegrationMethods: jest.fn(() => integrationMethods),
      },
    } as any;
    const command = getTestCommand(cliProviderService);
    const result = await command.chooseIntegrationMethod();
    expect(cliProviderService.cloudProviderService.creatableIntegrationMethods).toHaveBeenCalled();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        name: "selectedMethod",
        message: "select an integration method",
        type: "list",
        choices: integrationMethods.map((method: any) => ({ name: method.alias, value: method })),
      },
    ]);
    expect(result).toStrictEqual("selected-method");
  });
});
