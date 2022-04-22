import { jest, describe, test, expect } from "@jest/globals";
import CreateSsoIntegration from "./create";
import { AwsSsoIntegrationService, IntegrationCreationParams } from "@noovolari/leapp-core/services/aws-sso-integration-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("CreateSsoIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): CreateSsoIntegration => {
    const command = new CreateSsoIntegration(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

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
    const creationParam: IntegrationCreationParams = {
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
