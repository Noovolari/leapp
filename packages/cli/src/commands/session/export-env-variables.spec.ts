import { describe, jest, test, expect } from "@jest/globals";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import ExportEnvVariablesSession from "./export-env-variables";

describe("ExportEnvVariablesSession", () => {
  test("run", async () => {
    const profile = {
      flags: {
        profile: "profile",
      },
    };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).parse = jest.fn(async () => profile);
    (exportEnvVariablesSession as any).getSessionFromProfile = jest.fn(() => "session");
    (exportEnvVariablesSession as any).generateCredentialVariables = jest.fn(async () => "variables");
    (exportEnvVariablesSession as any).printSetVariablesCommand = jest.fn();

    await exportEnvVariablesSession.run();

    await expect((exportEnvVariablesSession as any).parse).toHaveBeenCalledWith(ExportEnvVariablesSession);
    expect(exportEnvVariablesSession.getSessionFromProfile).toHaveBeenCalledWith("profile");
    await expect(exportEnvVariablesSession.generateCredentialVariables).toHaveBeenCalledWith("session");
    expect(exportEnvVariablesSession.printSetVariablesCommand).toHaveBeenCalledWith("variables");
  });

  test("run - error", async () => {
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).parse = jest.fn(async () => {
      throw new Error("error");
    });

    await expect(exportEnvVariablesSession.run()).rejects.toThrow(new Error("error"));
  });

  test("run - unknown error", async () => {
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).parse = jest.fn(async () => {
      // eslint-disable-next-line
      throw "error";
    });

    await expect(exportEnvVariablesSession.run()).rejects.toThrow("Unknown error: error");
  });

  test("generateCredentialVariables", async () => {
    const session = { type: "sessionType", sessionId: "sessionId", region: "sessionRegion" } as any;

    const generateCredentials = jest.fn(() => ({
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "aws_access_key_id",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "aws_secret_access_key",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "aws_session_token",
      },
    }));
    const sessionService = new (AwsSessionService as any)(null, null);
    sessionService.generateCredentials = generateCredentials;

    const cliProviderService = {
      sessionFactory: {
        getSessionService: jest.fn(() => sessionService),
      },
    };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;

    const expectedVariables = [
      { name: "AWS_ACCESS_KEY_ID", value: "aws_access_key_id" },
      { name: "AWS_SECRET_ACCESS_KEY", value: "aws_secret_access_key" },
      { name: "AWS_SESSION_TOKEN", value: "aws_session_token" },
      { name: "AWS_REGION", value: session.region },
    ];

    const envVariables = await exportEnvVariablesSession.generateCredentialVariables(session);

    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.generateCredentials).toHaveBeenCalledWith(session.sessionId);
    expect(envVariables).toEqual(expectedVariables);
  });

  test("generateCredentialVariables - error", async () => {
    const session = { type: "sessionType", sessionId: "sessionId", region: "sessionRegion" } as any;
    const sessionService = {};

    const cliProviderService = {
      sessionFactory: {
        getSessionService: jest.fn(() => sessionService),
      },
    };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;

    await expect(exportEnvVariablesSession.generateCredentialVariables(session)).rejects.toThrow(
      new Error("session type not supported: sessionType")
    );
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
  });

  test("printSetVariablesCommand - win32", () => {
    const process = {
      platform: "win32",
    };
    const envVariables = [
      { name: "AWS_ACCESS_KEY_ID", value: "aws_access_key_id" },
      { name: "AWS_SECRET_ACCESS_KEY", value: "aws_secret_access_key" },
    ];
    const cliProviderService = {
      cliNativeService: {
        process,
      },
    };

    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;
    (exportEnvVariablesSession as any).log = jest.fn();

    exportEnvVariablesSession.printSetVariablesCommand(envVariables);

    expect(exportEnvVariablesSession.log).toHaveBeenCalledWith(
      'SET "AWS_ACCESS_KEY_ID=aws_access_key_id" & SET "AWS_SECRET_ACCESS_KEY=aws_secret_access_key"'
    );
  });

  test("printSetVariablesCommand - not win32", () => {
    const process = {
      platform: "darwin",
    };
    const envVariables = [
      { name: "AWS_ACCESS_KEY_ID", value: "aws_access_key_id" },
      { name: "AWS_SECRET_ACCESS_KEY", value: "aws_secret_access_key" },
    ];
    const cliProviderService = {
      cliNativeService: {
        process,
      },
    };

    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;
    (exportEnvVariablesSession as any).log = jest.fn();

    exportEnvVariablesSession.printSetVariablesCommand(envVariables);

    expect(exportEnvVariablesSession.log).toHaveBeenCalledWith(
      "export AWS_ACCESS_KEY_ID='aws_access_key_id'; export AWS_SECRET_ACCESS_KEY='aws_secret_access_key'"
    );
  });

  test("getSessionFromProfile", () => {
    const activeSessions = [{ name: "session1", profileId: "otherProfileId" }];
    const cliProviderService = { repository: { listActive: jest.fn(() => activeSessions) } };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;
    (exportEnvVariablesSession as any).getProfileId = jest.fn(() => "otherProfileId");
    (exportEnvVariablesSession as any).log = jest.fn();

    const profileName = "otherProfileName";
    const session = exportEnvVariablesSession.getSessionFromProfile(profileName);

    expect(exportEnvVariablesSession.getProfileId).toHaveBeenCalledWith("otherProfileName");
    expect(cliProviderService.repository.listActive).toHaveBeenCalled();
    expect(session).toEqual(activeSessions[0]);
  });

  test("getSessionFromProfile - no matching profileIds", () => {
    const activeSessions = [{ name: "session1", profileId: "profileId" }];
    const cliProviderService = { repository: { listActive: jest.fn(() => activeSessions) } };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;
    (exportEnvVariablesSession as any).getProfileId = jest.fn(() => "otherProfileId");
    (exportEnvVariablesSession as any).log = jest.fn();

    const profileName = "otherProfileName";

    expect(() => exportEnvVariablesSession.getSessionFromProfile(profileName)).toThrow(
      new Error(`no active aws session available for "${profileName}" named profile`)
    );
    expect(exportEnvVariablesSession.getProfileId).toHaveBeenCalledWith("otherProfileName");
    expect(cliProviderService.repository.listActive).toHaveBeenCalled();
  });

  test("getProfileId", () => {
    const profiles = [
      { name: "profileName", id: "profileId" },
      { name: "otherProfileName", id: "otherProfileId" },
    ];
    const cliProviderService = { repository: { getProfiles: jest.fn(() => profiles) } };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;

    const profileName = "profileName";
    const profileId = exportEnvVariablesSession.getProfileId(profileName);

    expect(cliProviderService.repository.getProfiles).toHaveBeenCalled();
    expect(profileId).toBe("profileId");
  });

  test("getProfileId - not found", () => {
    const profiles = [
      { name: "firstProfileName", id: "firstProfileId" },
      { name: "otherProfileName", id: "otherProfileId" },
    ];
    const cliProviderService = { repository: { getProfiles: jest.fn(() => profiles) } };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;

    const profileName = "profileName";

    expect(() => exportEnvVariablesSession.getProfileId(profileName)).toThrow(new Error(`AWS named profile "${profileName}" not found`));
    expect(cliProviderService.repository.getProfiles).toHaveBeenCalled();
  });

  test("getProfileId - more than one", () => {
    const profiles = [
      { name: "profileName", id: "profileId" },
      { name: "profileName", id: "profileId" },
      { name: "otherProfileName", id: "otherProfileId" },
    ];
    const cliProviderService = { repository: { getProfiles: jest.fn(() => profiles) } };
    const exportEnvVariablesSession = new ExportEnvVariablesSession(null, null);
    (exportEnvVariablesSession as any).cliProviderService = cliProviderService;

    const profileName = "profileName";

    expect(() => exportEnvVariablesSession.getProfileId(profileName)).toThrow(new Error("selected profile has more than one occurrence"));
    expect(cliProviderService.repository.getProfiles).toHaveBeenCalled();
  });
});
