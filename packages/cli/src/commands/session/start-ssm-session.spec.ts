import { describe, expect, jest, test } from "@jest/globals";
import StartSsmSession from "./start-ssm-session";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { CliProviderService } from "../../service/cli-provider-service";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("StartSsmSession", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): StartSsmSession => {
    const command = new StartSsmSession(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - sessionId && region && ssmInstanceId", async () => {
    let command = getTestCommand(new CliProviderService(), ["--sessionId"]);
    await expect(command.run()).rejects.toThrow("Flag --sessionId expects a value");

    command = getTestCommand(new CliProviderService(), ["--sessionId", "sgsg", "--region", "eu-west-1", "--ssmInstanceId", "ssmInstance"]);
    await expect(command.run()).rejects.toThrow("No session found with id sgsg");

    command = getTestCommand(new CliProviderService(), ["--sessionId", "session", "--region"]);
    await expect(command.run()).rejects.toThrow("Flag --region expects a value");

    const sessions = [
      {
        sessionId: "session",
        sessionName: "sessionName",
        type: SessionType.awsIamUser,
      },
    ];
    const cliMockService = {
      sessionManagementService: {
        getSessionById: jest.fn((id: string) => sessions.find((s) => s.sessionId === id)),
        getSessions: jest.fn(() => sessions),
      },
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "defaultId"),
      },
      sessionFactory: new CliProviderService().sessionFactory,
      cloudProviderService: new CliProviderService().cloudProviderService,
      awsCoreService: new CliProviderService().awsCoreService,
    };

    command = getTestCommand(cliMockService, ["--sessionId", "session", "--region", "x", "--ssmInstanceId", "ssmInstance"]);
    command.generateCredentials = jest.fn(async (): Promise<any> => "credentials");
    await expect(command.run()).rejects.toThrow("Provided region is not a valid AWS region");

    command = getTestCommand(cliMockService, ["--sessionId", "session", "--region", "eu-west-1", "--ssmInstanceId"]);
    await expect(command.run()).rejects.toThrow("Flag --ssmInstanceId expects a value");

    command = getTestCommand(cliMockService, ["--sessionId", "session", "--region", "eu-west-1", "--ssmInstanceId", "ssmInstance"]);
    command.selectSession = jest.fn(async (): Promise<any> => "session");
    command.generateCredentials = jest.fn(async (): Promise<any> => "credentials");
    (command as any).availableRegions = jest.fn((): any => [{ fieldName: "eu-west-1", fieldValue: "eu-west-1" }]);
    command.selectSsmInstance = jest.fn(async (): Promise<any> => "ssmInstance");
    command.startSsmSession = jest.fn(async () => {});
    await command.run();
    expect(command.generateCredentials).toHaveBeenCalledWith({ sessionId: "session", sessionName: "sessionName", type: "awsIamUser" });
    expect(command.startSsmSession).toHaveBeenCalledWith("credentials", "ssmInstance", "eu-west-1");
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand();

    command.selectSession = jest.fn(async (): Promise<any> => "session");
    command.generateCredentials = jest.fn(async (): Promise<any> => "credentials");
    command.selectRegion = jest.fn(async (): Promise<any> => "region");
    command.selectSsmInstance = jest.fn(async (): Promise<any> => "ssmInstance");
    command.startSsmSession = jest.fn(async () => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect(command.selectSession).toHaveBeenCalled();
    expect(command.generateCredentials).toHaveBeenCalledWith("session");
    expect(command.selectRegion).toHaveBeenCalledWith("session");
    expect(command.selectSsmInstance).toHaveBeenCalledWith("credentials", "region");
    expect(command.startSsmSession).toHaveBeenCalledWith("credentials", "ssmInstance", "region");
  };

  test("run - all ok", async () => {
    await runCommand(undefined, "");
  });

  test("run - deleteSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - deleteSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });

  test("selectSession", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{ sessionName: "awsSession", type: "aws" }, { sessionName: "azureSession" }]),
      },
      sessionFactory: {
        getSessionService: (sessionType) => (sessionType === "aws" ? new (AwsSessionService as any)() : "AzureSession"),
      },
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: "awsSession" })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedSession = await command.selectSession();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [{ name: "awsSession", value: { sessionName: "awsSession", type: "aws" } }],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual("awsSession");
  });

  test("generateCredentials", async () => {
    const awsSessionService = { generateCredentials: jest.fn(() => "credentials") };
    const cliProviderService: any = {
      sessionFactory: { getSessionService: jest.fn(() => awsSessionService) },
    };

    const command = getTestCommand(cliProviderService);

    const session = { sessionId: "sessionId", type: "type" } as any;
    const credentials = await command.generateCredentials(session);

    expect(credentials).toBe("credentials");
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(awsSessionService.generateCredentials).toHaveBeenCalledWith(session.sessionId);
  });

  test("selectRegion", async () => {
    const regionFieldChoice = { fieldName: "regionName2", fieldValue: "regionName3" };
    const cliProviderService: any = {
      cloudProviderService: {
        availableRegions: jest.fn(() => [regionFieldChoice]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedRegion",
              message: "select region",
              type: "list",
              choices: [{ name: regionFieldChoice.fieldName, value: regionFieldChoice.fieldValue }],
            },
          ]);
          return { selectedRegion: "selectedRegion" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);

    const session = { type: "type" } as any;
    const selectedRegion = await command.selectRegion(session);

    expect(selectedRegion).toBe("selectedRegion");
    expect(cliProviderService.cloudProviderService.availableRegions).toHaveBeenCalledWith(session.type);
  });

  test("selectSsmInstance", async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const instances = { Name: "instanceName", InstanceId: "instanceId" };
    const cliProviderService: any = {
      ssmService: { getSsmInstances: jest.fn(() => [instances]) },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedInstance",
              message: "select an instance",
              type: "list",
              choices: [{ name: instances.Name, value: instances.InstanceId }],
            },
          ]);
          return { selectedInstance: "selectedInstance" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);

    const selectedInstance = await command.selectSsmInstance("credentials" as any, "region");

    expect(selectedInstance).toBe("selectedInstance");
    expect(cliProviderService.ssmService.getSsmInstances).toHaveBeenCalledWith("credentials", "region");
  });

  test("startSsmSession, macOS, iTerm", async () => {
    const cliProviderService: any = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cliNativeService: { process: { platform: "darwin", env: { TERM_PROGRAM: "iTerm.app" } } },
      ssmService: { startSession: jest.fn(() => null) },
    };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    await command.startSsmSession("credentials" as any, "instanceId", "region");
    expect(cliProviderService.ssmService.startSession).toHaveBeenCalledWith("credentials", "instanceId", "region", constants.macOsIterm2);
    expect(command.log).toHaveBeenCalledWith("started AWS SSM session");
  });

  test("startSsmSession, macOS, Warp", async () => {
    const cliProviderService: any = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cliNativeService: { process: { platform: "darwin", env: { TERM_PROGRAM: "Warp.app" } } },
      ssmService: { startSession: jest.fn(() => null) },
    };
    const command = getTestCommand(cliProviderService);

    await command.startSsmSession("credentials" as any, "instanceId", "region");
    expect(cliProviderService.ssmService.startSession).toHaveBeenCalledWith("credentials", "instanceId", "region", constants.macOsTerminal);
  });

  test("startSsmSession, macOS, other terminal", async () => {
    const cliProviderService: any = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cliNativeService: { process: { platform: "darwin", env: { TERM_PROGRAM: "otherTerminal.app" } } },
      ssmService: { startSession: jest.fn(() => null) },
    };
    const command = getTestCommand(cliProviderService);

    await command.startSsmSession("credentials" as any, "instanceId", "region");
    expect(cliProviderService.ssmService.startSession).toHaveBeenCalledWith("credentials", "instanceId", "region", constants.macOsTerminal);
  });

  test("startSsmSession, windows, iTerm", async () => {
    const cliProviderService: any = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cliNativeService: { process: { platform: "win32", env: { TERM_PROGRAM: "iTerm.app" } } },
      ssmService: { startSession: jest.fn(() => null) },
    };
    const command = getTestCommand(cliProviderService);

    await command.startSsmSession("credentials" as any, "instanceId", "region");
    expect(cliProviderService.ssmService.startSession).toHaveBeenCalledWith("credentials", "instanceId", "region", undefined);
  });
});
