import { describe, test, expect, jest } from "@jest/globals";
import { LeappCommand } from "./leapp-command";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("LeappCommand", () => {
  test("init", async () => {
    const cliProviderService = {
      awsSsoRoleService: {
        setAwsIntegrationDelegate: jest.fn(),
      },
      awsSsoIntegrationService: "integrationService",
      remoteProceduresClient: {
        isDesktopAppRunning: jest.fn(async () => true),
      },
    };

    const leappCommand = new (LeappCommand as any)(null, null, cliProviderService);
    await leappCommand.init();

    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).toHaveBeenCalledWith(cliProviderService.awsSsoIntegrationService);
    expect(cliProviderService.remoteProceduresClient.isDesktopAppRunning).toHaveBeenCalled();
  });

  test("init - desktop app not running", async () => {
    const cliProviderService = {
      awsSsoRoleService: {
        setAwsIntegrationDelegate: jest.fn(),
      },
      awsSsoIntegrationService: "integrationService",
      remoteProceduresClient: {
        isDesktopAppRunning: jest.fn(async () => false),
      },
    };

    const leappCommand = new (LeappCommand as any)(null, null, cliProviderService);
    leappCommand.error = jest.fn();
    await leappCommand.init();

    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).toHaveBeenCalledWith(cliProviderService.awsSsoIntegrationService);
    expect(cliProviderService.remoteProceduresClient.isDesktopAppRunning).toHaveBeenCalled();
    expect(leappCommand.error).toHaveBeenCalledWith(
      "Leapp app must be running to use this CLI. You can download it here: https://www.leapp.cloud/releases"
    );
  });

  test("unsupportedAzureSession - azure session should throw an error", async () => {
    const mockedSession = { type: SessionType.azure };
    const leappCommand = new (LeappCommand as any)(null, null, null);
    leappCommand.error = jest.fn();
    expect(() => leappCommand.unsupportedAzureSession(mockedSession)).toThrow(new Error("Azure sessions currently not supported by Leapp CLI"));
  });

  test("unsupportedAzureSession - anything else then an azure session should not throw an error", async () => {
    const mockedSession = { type: SessionType.awsIamUser };
    const leappCommand = new (LeappCommand as any)(null, null, null);
    leappCommand.error = jest.fn();
    expect(() => leappCommand.unsupportedAzureSession(mockedSession)).not.toThrow();
  });

  test("unsupportedAzureSession - undefined should not throw an error", async () => {
    const mockedSession = undefined;
    const leappCommand = new (LeappCommand as any)(null, null, null);
    leappCommand.error = jest.fn();
    expect(() => leappCommand.unsupportedAzureSession(mockedSession)).not.toThrow();
  });
});
