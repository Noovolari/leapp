import { jest, describe, test, expect } from "@jest/globals";
import CreateSsoIntegration from "./create";
import { AwsSsoIntegrationService } from "@noovolari/leapp-core/services/integration/aws-sso-integration-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { CliProviderService } from "../../service/cli-provider-service";

describe("CreateSsoIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): CreateSsoIntegration => {
    const command = new CreateSsoIntegration(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - Validation and Existance", async () => {
    const command1 = getTestCommand(new CliProviderService(), ["--integrationAlias", ""]);
    const command2 = getTestCommand(new CliProviderService(), ["--integrationAlias", "", "--integrationPortalUrl", ""]);
    const command3 = getTestCommand(new CliProviderService(), ["--integrationAlias", "", "--integrationPortalUrl", "", "--integrationRegion", ""]);
    const command4 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "",
      "--integrationPortalUrl",
      "",
      "--integrationRegion",
      "",
      "--integrationMethod",
      "",
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
    command4.createIntegration = mock2;
    (command4 as any).askConfigurationParameters = mock1;

    await expect(command1.run()).rejects.toThrowError(
      "flags --integrationAlias, --integrationPortalUrl, --integrationRegion and --integrationMethod must be specified"
    );
    await expect(command2.run()).rejects.toThrowError(
      "flags --integrationAlias, --integrationPortalUrl, --integrationRegion and --integrationMethod must be specified"
    );
    await expect(command3.run()).rejects.toThrowError(
      "flags --integrationAlias, --integrationPortalUrl, --integrationRegion and --integrationMethod must be specified"
    );
    await expect(command4.run()).rejects.toThrowError("Alias must not be empty");

    const command5 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "",
      "--integrationRegion",
      "",
      "--integrationMethod",
      "",
    ]);
    command5.createIntegration = mock2;
    await expect(command5.run()).rejects.toThrowError("Portal URL must not be empty");

    const command6 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "ciao",
      "--integrationRegion",
      "",
      "--integrationMethod",
      "",
    ]);
    command6.createIntegration = mock2;
    await expect(command6.run()).rejects.toThrowError("Portal URL is not valid");

    const command7 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "https://www.google.com",
      "--integrationRegion",
      "ciao",
      "--integrationMethod",
      "",
    ]);
    command7.createIntegration = mock2;
    await expect(command7.run()).rejects.toThrowError("Provided region is not a valid AWS region");

    const command8 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "https://www.google.com",
      "--integrationRegion",
      "eu-west-1",
      "--integrationMethod",
      "",
    ]);
    command8.createIntegration = mock2;
    await expect(command8.run()).rejects.toThrowError("Provided method is not a valid integration method. Please use either In-app or In-browser");

    const command9 = getTestCommand(new CliProviderService(), [
      "--integrationAlias",
      "Alias",
      "--integrationPortalUrl",
      "https://www.google.it",
      "--integrationRegion",
      "eu-west-1",
      "--integrationMethod",
      "In-app",
    ]);
    const mock3 = jest.fn((_: any) => Promise.resolve());
    command9.createIntegration = mock3;
    await command9.run();
    expect(mock3).toHaveBeenCalledWith({
      alias: "Alias",
      portalUrl: "https://www.google.it",
      region: "eu-west-1",
      browserOpening: "In-app",
    });
  });

  test("askConfigurationParameters", async () => {
    const cliProviderService = {
      inquirer: {
        prompt: jest.fn(async (questions) => {
          if (questions[0].name === "selectedAlias") {
            return { selectedAlias: "alias" };
          } else if (questions[0].name === "selectedPortalUrl") {
            return { selectedPortalUrl: "portalUrl" };
          } else if (questions[0].name === "selectedRegion") {
            return { selectedRegion: "region" };
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
    const actualCreationParams = await command.askConfigurationParameters();

    expect(cliProviderService.inquirer.prompt).toHaveBeenNthCalledWith(1, [
      {
        name: "selectedAlias",
        message: "Insert an alias",
        validate: AwsSsoIntegrationService.validateAlias,
        type: "input",
      },
    ]);

    expect(cliProviderService.inquirer.prompt).toHaveBeenNthCalledWith(2, [
      {
        name: "selectedPortalUrl",
        message: "Insert a portal URL",
        validate: AwsSsoIntegrationService.validatePortalUrl,
        type: "input",
      },
    ]);

    expect(cliProviderService.inquirer.prompt).toHaveBeenNthCalledWith(3, [
      {
        name: "selectedRegion",
        message: "Select a region",
        type: "list",
        choices: [
          {
            name: "nameRegion1",
            value: "valueRegion1",
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
    });
    expect(cliProviderService.cloudProviderService.availableRegions).toHaveBeenCalledWith(SessionType.aws);
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const configurationParams = { param1: "param1" };

    const command = getTestCommand();
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

    expect(command.askConfigurationParameters).toHaveBeenCalled();
    expect(command.createIntegration).toHaveBeenCalledWith(configurationParams);
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
      awsSsoIntegrationService: {
        createIntegration: jest.fn(),
      },
      remoteProceduresClient: {
        refreshIntegrations: jest.fn(),
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
    await command.createIntegration(creationParam);

    expect(cliProviderService.awsSsoIntegrationService.createIntegration).toBeCalledWith(creationParam);
    expect(command.log).toHaveBeenCalledWith("aws sso integration created");
    expect(cliProviderService.remoteProceduresClient.refreshIntegrations).toHaveBeenCalled();
  });
});
