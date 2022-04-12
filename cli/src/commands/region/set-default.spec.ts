import { describe, expect, jest, test } from "@jest/globals";
import ChangeDefaultRegion from "./set-default";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import {CliProviderService} from "../../service/cli-provider-service";

describe("ChangeDefaultRegion", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): ChangeDefaultRegion => {
    const command = new ChangeDefaultRegion(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - awsRegion", async () => {
    const badNewRegion = "newRegion";
    const goodNewRegion = "eu-west-1";
    const cliProviderService: any = {
      regionsService: {
        changeDefaultAwsRegion: jest.fn(),
      },
      remoteProceduresClient: {
        refreshSessions: jest.fn(),
      },
      awsCoreService: {
        getRegions: new CliProviderService().awsCoreService.getRegions,
      },
    };

    let command = getTestCommand(cliProviderService, ["--awsRegion"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --awsRegion expects a value");

    command = getTestCommand(cliProviderService, ["--awsRegion", badNewRegion]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Region is not a valid AWS region");

    command = getTestCommand(cliProviderService, ["--awsRegion", goodNewRegion]);
    command.log = jest.fn();
    await command.run();
    expect(cliProviderService.regionsService.changeDefaultAwsRegion).toHaveBeenCalledWith(goodNewRegion);
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("default region changed");
  });

  test("selectDefaultRegion", async () => {
    const cliProviderService: any = {
      regionsService: {
        getDefaultAwsRegion: () => "region1",
      },
      cloudProviderService: {
        availableRegions: jest.fn(() => [{ fieldName: "region2", fieldValue: "region3" }]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedDefaultRegion",
              message: "current default region is region1, select a new default region",
              type: "list",
              choices: [{ name: "region2", value: "region3" }],
            },
          ]);
          return { selectedDefaultRegion: "selectedRegion" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedRegion = await command.selectDefaultRegion();
    expect(selectedRegion).toBe("selectedRegion");

    expect(cliProviderService.cloudProviderService.availableRegions).toHaveBeenCalledWith(SessionType.aws);
  });

  test("changeDefaultRegion", async () => {
    const newRegion = "newRegion";
    const cliProviderService: any = {
      regionsService: {
        changeDefaultAwsRegion: jest.fn(),
      },
      remoteProceduresClient: {
        refreshSessions: jest.fn(),
      },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    await command.changeDefaultRegion(newRegion);
    expect(cliProviderService.regionsService.changeDefaultAwsRegion).toHaveBeenCalledWith(newRegion);
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("default region changed");
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const region = "region";
    const command = getTestCommand();

    command.selectDefaultRegion = jest.fn(async (): Promise<any> => region);
    command.changeDefaultRegion = jest.fn(async (): Promise<void> => {
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

    expect(command.selectDefaultRegion).toHaveBeenCalled();
    expect(command.changeDefaultRegion).toHaveBeenCalledWith(region);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - changeDefaultRegion throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - changeDefaultRegion throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
