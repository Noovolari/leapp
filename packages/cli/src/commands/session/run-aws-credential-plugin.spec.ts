import { describe, expect, jest, test } from "@jest/globals";
import RunAwsCredentialPlugin from "./run-aws-credential-plugin";
import { OperatingSystem } from "@noovolari/leapp-core/models/operating-system";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("RunAwsCredentialPlugin", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): RunAwsCredentialPlugin => {
    const command = new RunAwsCredentialPlugin(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run with flags", async () => {
    const cliProviderService = {
      cliNativeService: { os: { platform: jest.fn(() => OperatingSystem.mac) } },
      sessionManagementService: { getSessionById: jest.fn(() => "selected-session") },
      pluginManagerService: { availableAwsCredentialsPlugins: () => [{ actionName: "", metadata: { uniqueName: "fake-plugin-name" } }] },
    };
    const argv = ["--sessionId", "fake-session-id", "--pluginName", "fake-plugin-name"];
    const command = getTestCommand(cliProviderService, argv);
    command.runPlugin = jest.fn();

    await command.run();

    expect(cliProviderService.sessionManagementService.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(command.runPlugin).toHaveBeenCalledWith("selected-session", { actionName: "", metadata: { uniqueName: "fake-plugin-name" } });
  });

  test("run with flags, session not found", async () => {
    const cliProviderService = {
      cliNativeService: { os: { platform: jest.fn(() => OperatingSystem.mac) } },
      sessionManagementService: { getSessionById: () => {} },
    };
    const argv = ["--sessionId", "fake-session-id", "--pluginName", "fake-plugin-name"];
    const command = getTestCommand(cliProviderService, argv);
    command.runPlugin = jest.fn();

    await expect(command.run()).rejects.toThrow("No session found with id fake-session-id");
  });

  test("run with flags, plugin not found", async () => {
    const cliProviderService = {
      cliNativeService: { os: { platform: jest.fn(() => OperatingSystem.mac) } },
      sessionManagementService: { getSessionById: () => "selected-session" },
      pluginManagerService: { getPluginByName: () => {}, availableAwsCredentialsPlugins: () => [] },
    };
    const argv = ["--sessionId", "fake-session-id", "--pluginName", "fake-plugin-name"];
    const command = getTestCommand(cliProviderService, argv);
    command.runPlugin = jest.fn();

    await expect(command.run()).rejects.toThrow("No AWS session plugin available with name fake-plugin-name");
  });

  test("run with flags, generic error", async () => {
    const command = getTestCommand({}, []);
    (command as any).parse = async () => {
      throw new Error("generic error");
    };
    (command as any).error = jest.fn();

    await command.run();
    expect(command.error).toHaveBeenCalledWith("generic error");
  });

  test("run with flags, unknown error", async () => {
    const command = getTestCommand({}, []);
    (command as any).parse = async () => {
      // eslint-disable-next-line no-throw-literal
      throw "unknown error";
    };
    (command as any).error = jest.fn();

    await command.run();
    expect(command.error).toHaveBeenCalledWith("Unknown error: unknown error");
  });

  test("run without flags", async () => {
    const cliProviderService = {
      cliNativeService: { os: { platform: jest.fn(() => "win32") } },
    };
    const command = getTestCommand(cliProviderService, []) as any;
    command.selectSession = jest.fn(async () => "fake-session");
    command.selectPlugin = jest.fn(async () => "fake-plugin");
    command.runPlugin = jest.fn();

    await command.run();

    expect(cliProviderService.cliNativeService.os.platform).toHaveBeenCalled();
    expect(command.selectSession).toHaveBeenCalled();
    expect(command.selectPlugin).toHaveBeenCalledWith(OperatingSystem.windows, "fake-session");
    expect(command.runPlugin).toHaveBeenCalledWith("fake-session", "fake-plugin");
  });

  test("runPlugin", async () => {
    const cliProviderService = {
      os: { platform: jest.fn(() => OperatingSystem.mac) },
      pluginManagerService: { pluginEnvironment: "fake-plugin-environment" },
    };
    const command = getTestCommand(cliProviderService, []);
    (command as any).log = jest.fn();

    const plugin = { applySessionAction: jest.fn(), run: jest.fn() } as any;
    await command.runPlugin("fake-session" as any, plugin);

    expect(plugin.run).toHaveBeenCalledWith("fake-session");
  });

  test("selectSession", async () => {
    const sessions = [
      { sessionName: "session1", type: SessionType.awsIamRoleFederated },
      { sessionName: "session2", type: SessionType.awsIamRoleFederated },
    ];
    const cliProviderService = {
      os: { platform: jest.fn(() => OperatingSystem.mac) },
      sessionFactory: { getCompatibleTypes: jest.fn(() => [SessionType.awsIamRoleFederated]) },
      sessionManagementService: { getSessions: jest.fn(() => sessions) },
      inquirer: {
        prompt: jest.fn(async (questions: any) => {
          expect(questions.length).toBe(1);
          const question = questions[0];
          expect(question.name).toBe("selectedSession");
          expect(question.message).toBe("select a session");
          expect(question.type).toBe("list");
          expect(question.choices).toStrictEqual([
            { name: "session1", value: sessions[0] },
            { name: "session2", value: sessions[1] },
          ]);
          return { selectedSession: "selected-session" };
        }),
      },
    };
    const command = getTestCommand(cliProviderService, []) as any;

    const selectedSession = await command.selectSession();
    expect(selectedSession).toBe("selected-session");

    expect(cliProviderService.sessionManagementService.getSessions).toHaveBeenCalled();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalled();
  });

  test("selectSession, no sessions found", async () => {
    const cliProviderService = { sessionManagementService: { getSessions: () => [] }, sessionFactory: { getCompatibleTypes: jest.fn(() => []) } };
    const command = getTestCommand(cliProviderService, []) as any;
    await expect(command.selectSession()).rejects.toThrow("no sessions available");
  });

  test("selectPlugin", async () => {
    const plugins = [
      { actionName: "plugin1", metadata: { uniqueName: "plugin1" } },
      { actionName: "plugin2", metadata: { uniqueName: "plugin2" } },
    ];
    const cliProviderService = {
      os: { platform: jest.fn(() => OperatingSystem.mac) },
      pluginManagerService: {
        loadFromPluginDir: jest.fn(async () => {}),
        availableAwsCredentialsPlugins: jest.fn(() => plugins),
      },
      inquirer: {
        prompt: jest.fn(async (questions: any) => {
          expect(questions.length).toBe(1);
          const question = questions[0];
          expect(question.name).toBe("selectedPlugin");
          expect(question.message).toBe("select a plugin");
          expect(question.type).toBe("list");
          expect(question.choices).toStrictEqual([
            { name: "plugin1", value: plugins[0] },
            { name: "plugin2", value: plugins[1] },
          ]);
          return { selectedPlugin: "selected-plugin" };
        }),
      },
    };
    const command = getTestCommand(cliProviderService, []) as any;

    const selectedPlugin = await command.selectPlugin("os", "selected-session");
    expect(selectedPlugin).toBe("selected-plugin");

    expect(cliProviderService.pluginManagerService.loadFromPluginDir).toHaveBeenCalled();
    expect(cliProviderService.pluginManagerService.availableAwsCredentialsPlugins).toHaveBeenCalledWith("os", "selected-session");
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalled();
  });

  test("selectPlugin, no plugin found", async () => {
    const cliProviderService = { pluginManagerService: { loadFromPluginDir: () => {}, availableAwsCredentialsPlugins: () => [] } };
    const command = getTestCommand(cliProviderService, []) as any;
    await expect(command.selectPlugin()).rejects.toThrow("no AWS credential plugins available for selected session on this operating system");
  });
});
