import { describe, expect, jest, test } from "@jest/globals";
import { SessionType } from "@hesketh-racing/leapp-core/models/session-type";
import { AwsIamUserService } from "@hesketh-racing/leapp-core/services/session/aws/aws-iam-user-service";
import CurrentSession from "./current";
import { AzureSessionService } from "@hesketh-racing/leapp-core/services/session/azure/azure-session-service";

const awsProvider = "aws";
const azureProvider = "azure";

describe("CurrentSession", () => {
  const getTestCommand = (cliProviderService: any = null): CurrentSession => {
    const command = new CurrentSession([], {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("currentSession", async () => {
    const command = getTestCommand();
    const session = "session";
    const dataFormat = "dataFormat";
    const dataFilter = "dataFilter";
    command.getSessionData = jest.fn(async () => "sessionData");
    command.filterSessionData = jest.fn(() => "filteredSessionData");
    command.formatSessionData = jest.fn(() => "   formattedSessionData   ");
    command.log = jest.fn();

    await command.currentSession(session as any, dataFormat, dataFilter as any);

    expect(command.getSessionData).toHaveBeenCalledWith(session);
    expect(command.filterSessionData).toHaveBeenCalledWith("sessionData", dataFilter);
    expect(command.formatSessionData).toHaveBeenCalledWith("filteredSessionData", dataFormat);
    expect(command.log).toHaveBeenCalledWith("formattedSessionData");
  });

  test("getSessionFromProfile - default, with provider", () => {
    const sessions = [
      { profileId: "profileId1", type: "type1" },
      { profileId: "profileId1", type: "type2" },
      { profileId: "profileId2", type: "type2" },
    ];
    const cliProviderService: any = {
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "profileId1"),
      },
      sessionManagementService: {
        getActiveSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService);

    const profileName = "default";
    const provider = "provider";

    const sessionTypes = ["type1"];
    (command.getProviderAssociatedSessionTypes as any) = jest.fn(() => sessionTypes);

    const sessionFromProfile = command.getSessionFromProfile(profileName, provider);

    expect(sessionFromProfile).toEqual({ profileId: "profileId1", type: "type1" });
    expect(cliProviderService.workspaceService.getDefaultProfileId).toHaveBeenCalled();
    expect(cliProviderService.sessionManagementService.getActiveSessions).toHaveBeenCalled();
    expect(command.getProviderAssociatedSessionTypes).toHaveBeenCalledWith(provider);
  });

  test("getSessionFromProfile - no default, without provider", () => {
    const sessions = [
      { profileId: "profileId1", type: "type1" },
      { profileId: "profileId2", type: "type2" },
    ];
    const cliProviderService: any = {
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "profileId1"),
      },
      sessionManagementService: {
        getActiveSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService);
    command.getProfileId = jest.fn(() => "profileId1");

    const profileName = "profileName";
    const provider = undefined;

    const sessionFromProfile = command.getSessionFromProfile(profileName, provider);

    expect(sessionFromProfile).toEqual({ profileId: "profileId1", type: "type1" });
    expect(command.getProfileId).toHaveBeenCalledWith(profileName);
    expect(cliProviderService.sessionManagementService.getActiveSessions).toHaveBeenCalled();
  });

  test("getSessionFromProfile - error: no sessions", () => {
    const sessions = [];
    const cliProviderService: any = {
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "profileId1"),
      },
      sessionManagementService: {
        getActiveSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService);

    const profileName = "default";
    const provider = undefined;

    expect(() => command.getSessionFromProfile(profileName, provider)).toThrow(new Error("no active sessions available for the specified criteria"));
    expect(cliProviderService.workspaceService.getDefaultProfileId).toHaveBeenCalled();
    expect(cliProviderService.sessionManagementService.getActiveSessions).toHaveBeenCalled();
  });

  test("getSessionFromProfile - error: selected profile has more than one active session related for the given provider", () => {
    const sessions = [
      { profileId: "profileId1", type: "type1" },
      { profileId: "profileId1", type: "type1" },
    ];
    const cliProviderService: any = {
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "profileId1"),
      },
      sessionManagementService: {
        getActiveSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService);
    const sessionTypes = ["type1"];
    (command.getProviderAssociatedSessionTypes as any) = jest.fn(() => sessionTypes);

    const profileName = "default";
    const provider = "provider";

    expect(() => command.getSessionFromProfile(profileName, provider)).toThrow(
      new Error("multiple active sessions found, please specify a provider with --provider")
    );
    expect(cliProviderService.workspaceService.getDefaultProfileId).toHaveBeenCalled();
    expect(cliProviderService.sessionManagementService.getActiveSessions).toHaveBeenCalled();
    expect(command.getProviderAssociatedSessionTypes).toHaveBeenCalledWith(provider);
  });

  test("getSessionFromProfile - error: more than one active session from different providers", () => {
    const sessions = [{ profileId: "profileId1", type: "type1" }, { type: "type2" }];
    const cliProviderService: any = {
      workspaceService: {
        getDefaultProfileId: jest.fn(() => "profileId1"),
      },
      sessionManagementService: {
        getActiveSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService);

    const profileName = "default";
    const provider = undefined;

    expect(() => command.getSessionFromProfile(profileName, provider)).toThrow(
      new Error("multiple active sessions found, please specify a provider with --provider")
    );
    expect(cliProviderService.workspaceService.getDefaultProfileId).toHaveBeenCalled();
    expect(cliProviderService.sessionManagementService.getActiveSessions).toHaveBeenCalled();
  });

  test("getProfileId", () => {
    const profiles = [
      { name: "profileName1", id: "profileId1" },
      { name: "profileName2", id: "profileId2" },
    ];
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => profiles),
      },
    };
    const profileName = "profileName1";
    const command = getTestCommand(cliProviderService);
    const profileId = command.getProfileId(profileName);

    expect(profileId).toBe("profileId1");
    expect(cliProviderService.namedProfilesService.getNamedProfiles).toHaveBeenCalled();
  });

  test("getProfileId - error: no profiles available", () => {
    const profiles = [
      { name: "profileName1", id: "profileId1" },
      { name: "profileName2", id: "profileId2" },
    ];
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => profiles),
      },
    };
    const profileName = "profileName3";
    const command = getTestCommand(cliProviderService);

    expect(() => command.getProfileId(profileName)).toThrow(new Error(`AWS named profile "${profileName}" not found`));
    expect(cliProviderService.namedProfilesService.getNamedProfiles).toHaveBeenCalled();
  });

  test("getProfileId - error: selected profile has more than one occurrence", () => {
    const profiles = [
      { name: "profileName1", id: "profileId1" },
      { name: "profileName1", id: "profileId2" },
      { name: "profileName2", id: "profileId3" },
    ];
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => profiles),
      },
    };
    const profileName = "profileName1";
    const command = getTestCommand(cliProviderService);

    expect(() => command.getProfileId(profileName)).toThrow(new Error("selected profile has more than one occurrence"));
    expect(cliProviderService.namedProfilesService.getNamedProfiles).toHaveBeenCalled();
  });

  test("getFieldRequired", () => {
    const command = getTestCommand();
    const fieldRequiredString = "field1 field2";
    const fieldRequiredArray = command.getFieldsRequired(fieldRequiredString);

    expect(fieldRequiredArray).toEqual(["field1", "field2"]);
  });

  test("getSessionData - aws iam user", async () => {
    const sessionService = new AwsIamUserService(null, null, null, null, null, null, null);
    sessionService.getAccountNumberFromCallerIdentity = jest.fn(async () => "000");

    const cliProviderService: any = {
      sessionFactory: {
        getSessionService: jest.fn(() => sessionService),
      },
    };
    const session = {
      sessionName: "sessionName",
      type: SessionType.awsIamUser,
    };
    const command = getTestCommand(cliProviderService);

    const sessionData = await command.getSessionData(session as any);

    expect(sessionData).toEqual({
      alias: session.sessionName,
      accountNumber: "000",
      roleArn: "none",
    });
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.getAccountNumberFromCallerIdentity).toHaveBeenCalledWith(session);
  });

  test("getSessionData - aws role federated", async () => {
    const sessionService = new AwsIamUserService(null, null, null, null, null, null, null);
    sessionService.getAccountNumberFromCallerIdentity = jest.fn(async () => "000");

    const cliProviderService: any = {
      sessionFactory: {
        getSessionService: jest.fn(() => sessionService),
      },
    };
    const session = {
      sessionName: "sessionName",
      type: SessionType.awsIamRoleFederated,
      roleArn: "role:arn",
    };
    const command = getTestCommand(cliProviderService);

    const sessionData = await command.getSessionData(session as any);

    expect(sessionData).toEqual({
      alias: session.sessionName,
      accountNumber: "000",
      roleArn: "role:arn",
    });
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.getAccountNumberFromCallerIdentity).toHaveBeenCalledWith(session);
  });

  test("getSessionData - azure", async () => {
    const cliProviderService: any = {
      sessionFactory: {
        getSessionService: jest.fn(() => new AzureSessionService(null, null, null, null, null, null, null, null)),
      },
    };
    const session = {
      sessionName: "sessionName",
      tenantId: "tenantId",
      subscriptionId: "subscriptionId",
      type: SessionType.azure,
    };
    const command = getTestCommand(cliProviderService);

    const sessionData = await command.getSessionData(session as any);

    expect(sessionData).toEqual({
      alias: "sessionName",
      tenantId: "tenantId",
      subscriptionId: "subscriptionId",
    });
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
  });

  test("getSessionData - error: session type not supported", async () => {
    const cliProviderService: any = {
      sessionFactory: {
        getSessionService: jest.fn(() => {}),
      },
    };
    const session = { type: "sessionType" };
    const command = getTestCommand(cliProviderService);

    await expect(() => command.getSessionData(session as any)).rejects.toThrow(new Error(`session type not supported: ${session.type}`));
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
  });

  test("filterSessionData - matching filters", () => {
    const command = getTestCommand();
    const sessionData = {
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    };
    const filterArray = ["alias"];
    const filteredSessionData = command.filterSessionData(sessionData, filterArray);

    expect(filteredSessionData).toEqual({
      alias: "sessionAlias",
    });
  });

  test("filterSessionData - non matching filters", () => {
    const command = getTestCommand();
    const sessionData = {
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    };
    const filterArray = ["name"];
    const filteredSessionData = command.filterSessionData(sessionData, filterArray);

    expect(filteredSessionData).toEqual({});
  });

  test("filterSessionData - no filter params (filerArray undefined)", () => {
    const command = getTestCommand();
    const sessionData = {
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    };
    const filterArray = undefined;
    const filteredSessionData = command.filterSessionData(sessionData, filterArray);

    expect(filteredSessionData).toEqual({
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    });
  });

  test("formatSessionData - JSON", () => {
    const sessionData = {
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    };
    const dataFormat = "JSON";
    const command = getTestCommand();

    const formattedSessionData = command.formatSessionData(sessionData, dataFormat);

    expect(formattedSessionData).toBe('{"alias":"sessionAlias","accountNumber":"sessionAccountNumber"}');
  });

  test("formatSessionData - inline", () => {
    const sessionData = {
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    };
    const dataFormat = "inline";
    const command = getTestCommand();

    const formattedSessionData = command.formatSessionData(sessionData, dataFormat);

    expect(formattedSessionData).toBe("alias: sessionAlias, accountNumber: sessionAccountNumber");
  });

  test("formatSessionData - error: formatting style not allowed", () => {
    const sessionData = {
      alias: "sessionAlias",
      accountNumber: "sessionAccountNumber",
    };
    const dataFormat = "notAllowedFormatStyle";
    const command = getTestCommand();

    expect(() => command.formatSessionData(sessionData, dataFormat)).toThrow(new Error(`formatting style not allowed "${dataFormat}"`));
  });

  test("getProviderAssociatedSessionTypes - awsProvider", () => {
    const provider = awsProvider;
    const command = getTestCommand();

    const sessionTypes = command.getProviderAssociatedSessionTypes(provider);

    expect(sessionTypes).toEqual([SessionType.awsIamUser, SessionType.awsIamRoleChained, SessionType.awsIamRoleFederated, SessionType.awsSsoRole]);
  });

  test("getProviderAssociatedSessionTypes - azureProvider", () => {
    const provider = azureProvider;
    const command = getTestCommand();

    const sessionTypes = command.getProviderAssociatedSessionTypes(provider);

    expect(sessionTypes).toEqual([SessionType.azure]);
  });

  const runCommand = async (
    errorToThrow: any,
    expectedErrorMessage: string,
    expectedFormat: string = null,
    expectedInline: boolean = false,
    expectedDataFormat: string = "JSON"
  ) => {
    const command = getTestCommand(null);

    const flags = { inline: expectedInline, profile: "profile", provider: "provider", format: expectedFormat };
    (command as any).parse = jest.fn(() => ({ flags }));

    (command.getSessionFromProfile as any) = jest.fn(async (): Promise<any> => "session");
    command.currentSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });
    (command as any).getFieldsRequired = jest.fn((): any => "dataFilter");

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    if (flags.format) {
      expect(command.getFieldsRequired).toHaveBeenCalledWith(flags.format);
    }
    expect(command.getSessionFromProfile).toHaveBeenCalledWith("profile", "provider");
    expect(command.currentSession).toHaveBeenCalledWith("session", expectedDataFormat, flags.format ? "dataFilter" : undefined);
  };

  test("run - all ok - json", async () => {
    await runCommand(undefined, "");
  });

  test("run - all ok - inline", async () => {
    await runCommand(undefined, "", null, true, "inline");
  });

  test("run - all ok - with format", async () => {
    await runCommand(undefined, "", "format");
  });

  test("run - generateSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - generateSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});
