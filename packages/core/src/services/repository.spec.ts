import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Repository } from "./repository";
import { FileService } from "./file-service";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";
import { Session } from "../models/session";
import { SessionType } from "../models/session-type";
import { SessionStatus } from "../models/session-status";
import { AwsSsoRoleSession } from "../models/aws/aws-sso-role-session";
import { LoggedException } from "./log-service";
import { LeappNotification, LeappNotificationType } from "../models/notification";

describe("Repository", () => {
  let mockedWorkspace;
  let mockedNativeService;
  let mockedFileService;
  let repository;
  let mockedSession: Session;
  let workspaceConsistencyService: any;
  let mockedNotifications: any;

  beforeEach(() => {
    mockedNotifications = [new LeappNotification("fake-uuid", LeappNotificationType.info, "title", "button-action-name", "description", false)];
    mockedWorkspace = new Workspace();
    mockedWorkspace.notifications = mockedNotifications;

    mockedNativeService = {
      copydir: jest.fn(),
      exec: jest.fn(),
      followRedirects: jest.fn(),
      fs: jest.fn(),
      httpProxyAgent: jest.fn(),
      httpsProxyAgent: jest.fn(),
      ini: jest.fn(),
      keytar: jest.fn(),
      log: jest.fn(),
      machineId: jest.fn(),
      os: { homedir: () => "" },
      path: jest.fn(),
      process: jest.fn(),
      rimraf: jest.fn(),
      semver: jest.fn(),
      sudo: jest.fn(),
      unzip: jest.fn(),
      url: jest.fn(),
    };

    workspaceConsistencyService = {
      createNewWorkspace: () => mockedWorkspace,
    };

    mockedFileService = new FileService(mockedNativeService);
    mockedFileService.readFileSync = jest.fn();
    mockedFileService.writeFileSync = jest.fn(() => {});
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(mockedWorkspace));
    mockedFileService.existsSync = jest.fn(() => false);
    mockedFileService.newDir = jest.fn();

    repository = new Repository(mockedNativeService, mockedFileService, workspaceConsistencyService);

    mockedSession = {
      sessionTokenExpiration: "",
      region: "eu-west-1",
      sessionId: "123456789",
      sessionName: "mock-session",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
  });

  test("get workspace() - returns the private workspace", () => {
    const workspace = repository.workspace;
    expect(workspace).toBe(mockedWorkspace);
  });

  test("set workspace() - set the private workspace", () => {
    const workspace = new Workspace();
    repository.workspace = workspace;
    expect(workspace).toBe((repository as any)._workspace);
  });

  test("reloadWorkspace", () => {
    workspaceConsistencyService.getWorkspace = jest.fn(() => mockedWorkspace);
    repository.reloadWorkspace();

    expect(workspaceConsistencyService.getWorkspace).toHaveBeenCalled();
    const actualWorkspace = (repository as any)._workspace;
    expect(actualWorkspace).toBe(mockedWorkspace);
  });

  test("createWorkspace() - create a new workspace", () => {
    workspaceConsistencyService.createNewWorkspace = jest.fn(() => mockedWorkspace);
    repository.persistWorkspace = jest.fn();
    repository.createWorkspace();
    expect(repository.workspace).not.toBe(null);
    expect(workspaceConsistencyService.createNewWorkspace).toHaveBeenCalled();
    expect(repository.persistWorkspace).toHaveBeenCalledWith((repository as any)._workspace);
  });

  test("createWorkspace() - directory exists", () => {
    mockedFileService.existsSync = () => true;
    repository.persistWorkspace = jest.fn();
    repository.createWorkspace();
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("removeWorkspace() - the workspace file exists", () => {
    const mockedHomedirPath = "mocked-homedir-path";
    mockedFileService.existsSync = jest.fn(() => true);
    mockedFileService.removeFileSync = jest.fn();
    mockedNativeService.os.homedir = jest.fn(() => mockedHomedirPath);
    repository.removeWorkspace();
    expect(mockedNativeService.os.homedir).toHaveBeenCalled();
    expect(mockedFileService.existsSync).toHaveBeenCalledWith(mockedHomedirPath + "/" + constants.lockFileDestination);
    expect(mockedFileService.removeFileSync).toHaveBeenCalledWith(mockedHomedirPath + "/" + constants.lockFileDestination);
  });

  test("removeWorkspace() - the workspace file doesn't exists", () => {
    const mockedHomedirPath = "mocked-homedir-path";
    mockedNativeService.os.homedir = () => mockedHomedirPath;
    mockedFileService.existsSync = jest.fn(() => false);
    mockedFileService.removeFileSync = jest.fn();
    repository.removeWorkspace();
    expect(mockedFileService.existsSync).toHaveBeenCalledWith(mockedHomedirPath + "/" + constants.lockFileDestination);
    expect(mockedFileService.removeFileSync).not.toHaveBeenCalled();
  });

  test("getWorkspace() - workspace not set", () => {
    (repository as any).reloadWorkspace = jest.fn();
    (repository as any)._workspace = undefined;

    const actualWorkspace = repository.getWorkspace();
    expect(actualWorkspace).toBe(undefined);
    expect((repository as any).reloadWorkspace).toHaveBeenCalled();
  });

  test("getWorkspace() - workspace already set", () => {
    const fakeWorkspace = {};
    (repository as any)._workspace = fakeWorkspace;

    const actualWorkspace = repository.getWorkspace();
    expect(actualWorkspace).toEqual(fakeWorkspace);
    expect(repository.getWorkspace()).toBe(actualWorkspace);
  });

  test("persistWorkspace() - to save the new status of a workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    expect(repository.workspace).not.toBe(workspace);

    repository.persistWorkspace(workspace);

    expect(mockedFileService.writeFileSync).not.toBe(null);
    expect(mockedFileService.writeFileSync).toHaveBeenCalledWith("/" + constants.lockFileDestination, JSON.stringify(workspace));
  });

  test("getSessions() - get the sessions persisted in the workspace", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(mockedFileService.writeFileSync).not.toBe(null);
    expect(mockedFileService.writeFileSync).toHaveBeenCalledWith("/" + constants.lockFileDestination, JSON.stringify(workspace));
    expect(repository.getSessions()).toStrictEqual([mockedSession]);
  });

  test("getSessionById() - get a session give an ID", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getSessionById("123456789")).toStrictEqual(mockedSession);
  });

  test("getSessionById() - session ID doesn't exist", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(() => repository.getSessionById("notExistingId")).toThrowError("session with id notExistingId not found.");
  });

  test("addSession() - add a new session to the array of sessions", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
      sessionTokenExpiration: "",
      region: "eu-west-2",
      sessionId: "987654321",
      sessionName: "mocked-2",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
    repository.addSession(mockedSession2);

    expect(repository.getSessions()).toStrictEqual([mockedSession, mockedSession2]);
  });

  test("updateSession() - updates a specific session", () => {
    const workspace = new Workspace();
    const mockedSession3 = { sessionId: "fake-id" };
    workspace.sessions = [mockedSession, mockedSession3 as any];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
      sessionTokenExpiration: "",
      region: "eu-west-2",
      sessionId: "123456789",
      sessionName: "mocked-2",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
    repository.updateSession("123456789", mockedSession2);

    expect(repository.getSessionById("123456789")).not.toBe(mockedSession);
    expect(repository.getSessionById("123456789")).toBe(mockedSession2);
    expect(repository.getSessions()).toStrictEqual([mockedSession2, mockedSession3]);
  });

  test("updateSessions() - bulk updates all sessions at once", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
      sessionTokenExpiration: "",
      region: "eu-west-2",
      sessionId: "123456789",
      sessionName: "mocked-2",
      status: 0,
      type: SessionType.awsIamUser,
      expired: (): boolean => false,
    };
    repository.updateSessions([mockedSession2]);
    expect(repository.getSessions()).not.toStrictEqual([mockedSession]);
    expect(repository.getSessions()).toStrictEqual([mockedSession2]);
  });

  test("deleteSession() - remove a session from the array of sessions", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    repository.deleteSession("123456789");
    expect(repository.getSessions()).not.toStrictEqual([mockedSession]);
    expect(repository.getSessions()).toStrictEqual([]);
  });

  test("deleteSession() - no session found", () => {
    const workspace = { sessions: [{ sessionId: "fake-session-id-1" }, { sessionId: "fake-session-id-2" }] };
    repository.persistWorkspace = jest.fn();
    repository.getWorkspace = () => workspace;
    repository.deleteSession("wrong-id");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("listPending() - list sessions in pending state", () => {
    mockedSession.status = SessionStatus.pending;
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listPending()).toStrictEqual([mockedSession]);

    mockedSession.status = SessionStatus.active;
    workspace.sessions = [mockedSession];

    expect(repository.listPending()).toStrictEqual([]);
  });

  test("listActive() - list sessions in active state", () => {
    mockedSession.status = SessionStatus.active;
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listActive()).toStrictEqual([mockedSession]);

    mockedSession.status = SessionStatus.pending;
    workspace.sessions = [mockedSession];

    expect(repository.listActive()).toStrictEqual([]);
  });

  test("listActiveAndPending() - with pending and active sessions ", () => {
    const session1 = { id: 1, status: SessionStatus.active };
    const session2 = { id: 2, status: SessionStatus.pending };
    const workspace = { sessions: [session1, session2, { id: 3, status: SessionStatus.inactive }] };
    repository.getWorkspace = () => workspace;
    const result = repository.listActiveAndPending();
    expect(result).toStrictEqual([session1, session2]);
  });

  test("listActiveAndPending() - without sessions key", () => {
    const workspace = {};
    repository.getWorkspace = () => workspace;
    const result = repository.listActiveAndPending();
    expect(result).toStrictEqual([]);
  });

  test("listActiveAndPending() - without sessions length equal to 0", () => {
    const workspace = { session: [] };
    repository.getWorkspace = () => workspace;
    const result = repository.listActiveAndPending();
    expect(result).toStrictEqual([]);
  });

  test("listAwsSsoRoles() - list sessions of type AwsSsoRole", () => {
    mockedSession.type = SessionType.awsSsoRole;
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoRoles()).toStrictEqual([mockedSession]);

    mockedSession.type = SessionType.awsIamRoleFederated;
    workspace.sessions = [mockedSession];

    expect(repository.listAwsSsoRoles()).toStrictEqual([]);
  });

  test("listAssumable() - list sessions of any type that can be assumed by AwsIamRoleChained", () => {
    mockedSession.type = SessionType.awsIamRoleFederated;
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAssumable()).toStrictEqual([mockedSession]);

    mockedSession.type = SessionType.azure;
    workspace.sessions = [mockedSession];

    expect(repository.listAssumable()).toStrictEqual([]);
  });

  test("listIamRoleChained() - list sessions of type AwsIamRoleChained without parentSession argument", () => {
    const session1 = { id: 1, type: SessionType.awsIamRoleChained };
    const session2 = { id: 2, type: SessionType.awsIamRoleFederated };
    const workspace = { sessions: [session1, session2] };
    repository.getWorkspace = () => workspace;
    const result = repository.listIamRoleChained();
    expect(result).toStrictEqual([session1]);
  });

  test("listIamRoleChained() - list sessions of type AwsIamRoleChained without sessions key", () => {
    const workspace = {};
    repository.getWorkspace = () => workspace;
    const result = repository.listIamRoleChained();
    expect(result).toStrictEqual([]);
  });

  test("listIamRoleChained() - list sessions of type AwsIamRoleChained with session length equal to 0", () => {
    const workspace = { sessions: [] };
    repository.getWorkspace = () => workspace;
    const result = repository.listIamRoleChained();
    expect(result).toStrictEqual([]);
  });

  test("listIamRoleChained() - list sessions of type AwsIamRoleChained with parentSession argument", () => {
    const session1 = { id: 1, type: SessionType.awsIamRoleChained, parentSessionId: "fake-id" };
    const session2 = { id: 2, type: SessionType.awsIamRoleChained, parentSessionId: "wrong-fake-id" };
    const parentSession = { sessionId: "fake-id" };
    const workspace = { sessions: [session1, session2] };
    repository.getWorkspace = () => workspace;
    const result = repository.listIamRoleChained(parentSession);
    expect(result).toStrictEqual([session1]);
  });

  test("getDefaultRegion() - default rigion property from workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getDefaultRegion()).toStrictEqual(workspace.defaultRegion);
  });

  test("getDefaultLocation() - default location property from workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getDefaultLocation()).toStrictEqual(workspace.defaultLocation);
  });

  test("updateDefaultRegion() - update default region property in workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);
    repository.updateDefaultRegion("mocked");
    expect("mocked").toStrictEqual(workspace.defaultRegion);
  });

  test("updateDefaultLocation() - update default location property in workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);
    repository.updateDefaultLocation("mocked");
    expect("mocked").toStrictEqual(workspace.defaultLocation);
  });

  test("getIdpUrl() - get saved idpUrl by id", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    const mockedIdp = { id: "1234", url: "mocked-url" };
    workspace.idpUrls.push(mockedIdp);
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);
    expect(repository.getIdpUrl("1234")).toStrictEqual(mockedIdp.url);
  });

  test("getIdpUrls() - get saved idpUrls", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    const mockedIdp = { id: "1234", url: "mocked-url" };
    workspace.idpUrls.push(mockedIdp);
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);
    expect(repository.getIdpUrls()).toStrictEqual([mockedIdp]);
  });

  test("addIdpUrl() - add a new IdpUrl", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    repository.workspace = workspace;

    const mockedIdp = { id: "1234", url: "mocked-url" };
    repository.addIdpUrl(mockedIdp);

    repository.persistWorkspace(workspace);
    expect(repository.getIdpUrls()).toStrictEqual([mockedIdp]);
  });

  test("updateIdpUrl() - update a IdpUrl", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;

    const mockedIdp = { id: "1234", url: "mocked-url" };
    workspace.idpUrls.push(mockedIdp);

    repository.updateIdpUrl("1234", "mocked-url-2");

    repository.persistWorkspace(workspace);
    expect(repository.getIdpUrl("1234")).toStrictEqual("mocked-url-2");
  });

  test("updateIdpUrl() - idpUrl not found", () => {
    const workspace = { idpUrls: [{ id: "fake-idpurl" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.updateIdpUrl("wrong-idpurl");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("removeIdpUrl() - update a IdpUrl", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;

    const mockedIdp = { id: "1234", url: "mocked-url" };
    workspace.idpUrls.push(mockedIdp);

    repository.removeIdpUrl("1234", "mocked-url-2");

    repository.persistWorkspace(workspace);
    expect(repository.getIdpUrl("1234")).toStrictEqual(null);
  });

  test("getProfiles() - get all profiles", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;

    const mockedProfile = { id: "1234", name: "mocked-url" };
    workspace.profiles.push(mockedProfile);

    repository.persistWorkspace(workspace);
    expect(repository.getProfiles()).toStrictEqual([workspace.profiles[0], mockedProfile]);
  });

  test("getProfileName() - get a profile's name", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;

    const mockedProfile = { id: "1234", name: "mocked-url" };
    workspace.profiles.push(mockedProfile);

    repository.persistWorkspace(workspace);
    expect(repository.getProfileName("1234")).toStrictEqual("mocked-url");
  });

  test("doesProfileExists() - check if a profile is in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;

    const mockedProfile = { id: "1234", name: "mocked-url" };
    workspace.profiles.push(mockedProfile);

    repository.persistWorkspace(workspace);
    expect(repository.doesProfileExist("1234")).toStrictEqual(true);
    expect(repository.doesProfileExist("4444")).toStrictEqual(false);
  });

  test("getDefaultProfileId() - get the standard default profile id", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.profiles.length).toBe(1);

    const defaultProfile = workspace.profiles[0];
    expect(repository.getDefaultProfileId()).toStrictEqual(defaultProfile.id);
  });

  test("getDefaultProfileId() - no default named profile found", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.profiles = [];
    expect(() => repository.getDefaultProfileId()).toThrow("no default named profile found.");
  });

  test("addProfile() - add a new profile to the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.profiles.length).toBeGreaterThan(0);
    expect(workspace.profiles.length).toBe(1);

    repository.addProfile({ id: "2345", name: "test" });
    expect(repository.getProfiles().length).toStrictEqual(2);
    expect(repository.doesProfileExist("2345")).toBe(true);
  });

  test("updateProfile() - update a profile in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.profiles.length).toBeGreaterThan(0);
    expect(workspace.profiles.length).toBe(1);

    repository.addProfile({ id: "2345", name: "test" });

    expect(repository.getProfiles().length).toStrictEqual(2);
    expect(repository.getProfileName("2345")).toBe("test");

    repository.updateProfile("2345", "test2");

    expect(repository.getProfiles().length).toStrictEqual(2);
    expect(repository.getProfileName("2345")).toBe("test2");
  });

  test("updateProfile() - profile not found", () => {
    const workspace = { profiles: [{ id: "fake-profile-id" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.updateProfile("wrong-profile-id");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("deleteProfile() - delete a profile in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.profiles.length).toBeGreaterThan(0);
    expect(workspace.profiles.length).toBe(1);

    repository.addProfile({ id: "2345", name: "test" });

    expect(repository.getProfiles().length).toStrictEqual(2);
    expect(repository.getProfileName("2345")).toBe("test");

    repository.removeProfile("2345");

    expect(repository.getProfiles().length).toStrictEqual(1);
    expect(() => repository.getProfileName("2345")).toThrow(LoggedException);
  });

  test("listAwsSsoIntegrations() - get all the aws sso integration we have in the workspace", () => {
    const workspace = new Workspace();
    workspace.awsSsoIntegrations = [];
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(0);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.awsSsoIntegrations = [{}, {}];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(2);
  });

  test("getAwsSsoIntegration() - get a specific integration given the id", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.awsSsoIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getAwsSsoIntegration("1234").alias).toBe("1");
  });

  test("getAwsSsoIntegrationSessions() - get a list of sessions for a specific integration given the id", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.sessions = [
      {
        sessionId: "12",
        sessionName: "session1",
        type: SessionType.awsSsoRole,
        status: SessionStatus.inactive,
        region: "eu-west-1",
        expired: () => false,
        awsSsoConfigurationId: "1234",
      } as AwsSsoRoleSession,
      {
        sessionId: "23",
        sessionName: "session2",
        type: SessionType.awsSsoRole,
        status: SessionStatus.inactive,
        region: "eu-west-1",
        sessionTokenExpiration: "",
        expired: () => false,
      },
      {
        sessionId: "34",
        sessionName: "session3",
        type: SessionType.awsSsoRole,
        status: SessionStatus.inactive,
        region: "eu-west-1",
        sessionTokenExpiration: "",
        expired: () => false,
      },
    ];

    workspace.awsSsoIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getAwsSsoIntegrationSessions("1234")[0].sessionName).toBe("session1");
  });

  test("addAwsSsoIntegration() - add a specific integration to the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.awsSsoIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(2);

    repository.addAwsSsoIntegration("url", "alias", "eu-west-1", "in-app");

    expect(repository.listAwsSsoIntegrations().length).toBe(3);
    expect(repository.listAwsSsoIntegrations()[2].alias).toBe("alias");
  });

  test("updateAwsSsoIntegration() - update a specific integration in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.awsSsoIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(2);

    repository.updateAwsSsoIntegration("1234", "alias", "b", "url", "in-app");

    expect(repository.listAwsSsoIntegrations().length).toBe(2);
    expect(repository.listAwsSsoIntegrations()[0].alias).toBe("alias");
    expect(repository.listAwsSsoIntegrations()[0].portalUrl).toBe("url");
    expect(repository.listAwsSsoIntegrations()[0].region).toBe("b");
    expect(repository.listAwsSsoIntegrations()[0].browserOpening).toBe("in-app");
  });

  test("updateAwsSsoIntegration() - no integrations found", () => {
    repository.persistWorkspace = jest.fn();
    const id = "fake-sso-id";
    const workspace = { awsSsoIntegrations: [{ id: "wrong-id" }] };
    repository.getWorkspace = () => workspace;
    repository.updateAwsSsoIntegration(id, null, null, null, null);
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("updateAwsSsoIntegration() - with expirationTime argument", () => {
    repository.persistWorkspace = jest.fn();
    const id = "fake-sso-id";
    const integration = { id };
    const accessTokenExpiration = "fake-expiration-time-value";
    const workspace = { awsSsoIntegrations: [integration] };
    repository.getWorkspace = () => workspace;
    repository.updateAwsSsoIntegration(id, "fake-alias", "fake-region", "fake-portal-url", "fake-browser-opening", true, accessTokenExpiration);
    expect(integration).toEqual({
      id,
      alias: "fake-alias",
      region: "fake-region",
      portalUrl: "fake-portal-url",
      browserOpening: "fake-browser-opening",
      isOnline: true,
      accessTokenExpiration,
    });
    expect(repository.persistWorkspace).toHaveBeenCalled();
  });

  test("unsetAwsSsoIntegrationExpiration() - put accessTokenExpiration to undefined", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.awsSsoIntegrations = [{ id: "1234", alias: "1", region: "a", accessTokenExpiration: "1000", browserOpening: "", portalUrl: "" }];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(1);

    repository.unsetAwsSsoIntegrationExpiration("1234");

    expect(repository.listAwsSsoIntegrations().length).toBe(1);
    expect(repository.listAwsSsoIntegrations()[0].accessTokenExpiration).toBe(undefined);
  });

  test("unsetAwsSsoIntegrationExpiration() - integration not found", () => {
    const workspace = { awsSsoIntegrations: [{ id: "fake-integration-id" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.unsetAwsSsoIntegrationExpiration("wrong-integration-id");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("deleteAwsSsoIntegration() - remove an integration from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.awsSsoIntegrations = [{ id: "1234", alias: "1", region: "a", accessTokenExpiration: "1000", browserOpening: "", portalUrl: "" }];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(1);

    repository.deleteAwsSsoIntegration("1234");

    expect(repository.listAwsSsoIntegrations().length).toBe(0);
    expect(repository.listAwsSsoIntegrations()[0]).toBe(undefined);
  });

  test("deleteAwsSsoIntegration() - integration not found", () => {
    const workspace = { awsSsoIntegrations: [{ id: "fake-integration-id" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.deleteAwsSsoIntegration("wrong-integration-id");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("listAzureIntegrations() - get all the azure integrations we have in the workspace", () => {
    const workspace = new Workspace();
    workspace.azureIntegrations = [];
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAzureIntegrations().length).toBe(0);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.azureIntegrations = [{}, {}];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAzureIntegrations().length).toBe(2);
  });

  test("getAzureIntegration() - get a specific integration given the id", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.azureIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", tenantId: "1" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", tenantId: "2" },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getAzureIntegration("1234").tenantId).toBe("1");
    expect(repository.getAzureIntegration("4567").tenantId).toBe("2");
    expect(repository.getAzureIntegration("8910")).toBe(undefined);
  });

  test("addAzureIntegration() - add a specific integration to the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.azureIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", tenantId: "1" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", tenantId: "2" },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAzureIntegrations().length).toBe(2);

    repository.addAzureIntegration("alias", "1234", "region-1");

    expect(repository.listAzureIntegrations().length).toBe(3);
    expect(repository.listAzureIntegrations()[2].alias).toBe("alias");
    expect(repository.listAzureIntegrations()[2].tenantId).toBe("1234");
  });

  test("updateAzureIntegration() - update a specific integration in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.azureIntegrations = [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "1234", alias: "1", tenantId: "1", isOnline: false },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      { id: "4567", alias: "2", tenantId: "2", isOnline: false },
    ];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAzureIntegrations().length).toBe(2);

    repository.updateAzureIntegration("1234", "alias", "ti1", "fake", true);

    expect(repository.listAzureIntegrations().length).toBe(2);
    expect(repository.listAzureIntegrations()[0].alias).toBe("alias");
    expect(repository.listAzureIntegrations()[0].tenantId).toBe("ti1");
    expect(repository.listAzureIntegrations()[0].isOnline).toBe(true);
  });

  test("updateAzureIntegration() - integration not found", () => {
    const workspace = { azureIntegrations: [{ id: "fake-integration-id" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.updateAzureIntegration("wrong-integration-id");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("deleteAzureIntegration() - remove an integration from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.azureIntegrations = [{ id: "1234", alias: "1", tenantId: "1111", isOnline: false }];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAzureIntegrations().length).toBe(1);

    repository.deleteAzureIntegration("1234");

    expect(repository.listAzureIntegrations().length).toBe(0);
    expect(repository.listAzureIntegrations()[0]).toBe(undefined);
  });

  test("deleteAzureIntegration() - integration not found", () => {
    const workspace = { azureIntegrations: [{ id: "fake-integration-id" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.deleteAzureIntegration("wrong-integration-id");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("getProxyConfiguration() - get the proxy config object from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.proxyConfiguration = { password: "test" };

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getProxyConfiguration()).not.toBe(undefined);
    expect(repository.getProxyConfiguration().password).toBe("test");
  });

  test("updateProxyConfiguration() - update the proxy config object from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.proxyConfiguration = { password: "test" };

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getProxyConfiguration()).not.toBe(undefined);
    expect(repository.getProxyConfiguration().password).toBe("test");
    expect(repository.getProxyConfiguration().username).toBe(undefined);

    repository.updateProxyConfiguration({ password: "new-test", username: "user", proxyProtocol: "https" });

    expect(repository.getProxyConfiguration()).not.toBe(undefined);
    expect(repository.getProxyConfiguration().password).toBe("new-test");
    expect(repository.getProxyConfiguration().username).toBe("user");
  });

  test("getSegments() - get all the segments from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    workspace.segments = [
      {
        name: "segmentA",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
      {
        name: "segmentB",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
    ];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getSegments()).not.toBe(undefined);
    expect(repository.getSegments().length).toBe(2);
    expect(repository.getSegments()[1].name).toBe("segmentB");
  });

  test("getSegment() - get a specific segment from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    workspace.segments = [
      {
        name: "segmentA",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
      {
        name: "segmentB",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
    ];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getSegment("segmentA")).not.toBe(undefined);
    expect(repository.getSegment("segmentA")).not.toBe(repository.getSegment("segmentB"));
    expect(repository.getSegment("segmentA").name).toBe("segmentA");
  });

  test("setSegments() - set a new segment array of segments for the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    workspace.segments = [
      {
        name: "segmentA",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
      {
        name: "segmentB",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
    ];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const newSegments = workspace.segments;
    newSegments.push({
      name: "segmentC",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      filterGroup: {},
    });
    repository.setSegments(newSegments);

    expect(repository.getSegment("segmentC").name).toBe("segmentC");
    expect(repository.getSegment("segmentA")).not.toBe(repository.getSegment("segmentC"));
    expect(repository.getSegments().length).toBe(3);
  });

  test("removeSegment() - remove a segment  from segments of the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    workspace.segments = [
      {
        name: "segmentA",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
      {
        name: "segmentB",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterGroup: {},
      },
    ];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const newSegments = workspace.segments;
    newSegments.push({
      name: "segmentC",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      filterGroup: {},
    });
    repository.setSegments(newSegments);

    expect(repository.getSegment("segmentC").name).toBe("segmentC");
    expect(repository.getSegment("segmentA")).not.toBe(repository.getSegment("segmentC"));
    expect(repository.getSegments().length).toBe(3);

    repository.removeSegment({ name: "segmentA", filterGroup: {} });

    expect(repository.getSegment("segmentA")).toBe(undefined);
    expect(repository.getSegments().length).toBe(2);
  });

  test("removeSegment() - segment not found", () => {
    const workspace = { segments: [{ name: "fake-segment-name" }] };
    repository.getWorkspace = () => workspace;
    repository.persistWorkspace = jest.fn();
    repository.removeSegment("wrong-segment-name");
    expect(repository.persistWorkspace).not.toHaveBeenCalled();
  });

  test("getFolders() - get the folders object from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.folders = [{ name: "test" }];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getFolders()).not.toBe(undefined);
    expect(repository.getFolders().length).toBe(1);
    expect(repository.getFolders()[0].name).toBe("test");
  });

  test("setFolders() - set the folder array object for the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.folders = [{ name: "test" }];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getFolders()).not.toBe(undefined);
    expect(repository.getFolders().length).toBe(1);
    expect(repository.getFolders()[0].name).toBe("test");

    const newFolders = workspace.folders;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    newFolders.push({ name: "test2" });
    repository.setFolders(newFolders);

    expect(repository.getFolders()).not.toBe(undefined);
    expect(repository.getFolders().length).toBe(2);
    expect(repository.getFolders()[1].name).toBe("test2");
  });

  test("updateMacOsTerminal() - set the terminal option for MacOs in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.macOsTerminal).toBe(constants.macOsTerminal);

    repository.updateMacOsTerminal(constants.macOsTerminal);
    expect(workspace.macOsTerminal).toBe(constants.macOsTerminal);

    repository.updateMacOsTerminal(constants.macOsIterm2);
    expect(workspace.macOsTerminal).toBe(constants.macOsIterm2);

    repository.updateMacOsTerminal(constants.macOsWarp);
    expect(workspace.macOsTerminal).toBe(constants.macOsWarp);
  });

  test("updateColorTheme() - set the color theme variable in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.colorTheme).toBe(undefined);

    repository.updateColorTheme(constants.darkTheme);
    expect(workspace.colorTheme).toBe(constants.darkTheme);

    repository.updateColorTheme(constants.lightTheme);
    expect(workspace.colorTheme).toBe(constants.lightTheme);
  });

  test("getColorTheme() - get the color theme variable in the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.getColorTheme()).toBe(undefined);

    repository.updateColorTheme(constants.darkTheme);
    expect(repository.getColorTheme()).toBe(constants.darkTheme);
  });

  test("createPluginStatus() - creates a new pluginStatus", () => {
    (repository as any)._workspace = {
      pluginsStatus: [],
    };
    repository.createPluginStatus("pluginId");
    expect((repository as any)._workspace.pluginsStatus).toStrictEqual([{ id: "pluginId", active: true }]);
  });

  test("getPluginStatus() - get the pluginStatus from a pluginId", () => {
    (repository as any)._workspace = {
      pluginsStatus: [{ id: "id1" }, { id: "id2" }],
    };
    const result = repository.getPluginStatus("id1");
    expect(result).toStrictEqual({ id: "id1" });
  });

  test("setPluginStatus() - set the newStatus of a pluginStatus from a pluginId", () => {
    (repository as any)._workspace = {
      pluginsStatus: [{ id: "id1" }, { id: "id2" }],
    };
    repository.setPluginStatus("id1", "new-status");
    expect((repository as any)._workspace.pluginsStatus).toStrictEqual(["new-status", { id: "id2" }]);
  });

  test("writeFile", () => {
    const data = "data-mock";
    repository.nativeService = { fs: { writeFileSync: jest.fn() } };
    repository.writeFile(data);
    expect(repository.nativeService.fs.writeFileSync).toHaveBeenCalledWith(__dirname + "/register-client-response", JSON.stringify(data));
  });

  test("globalSettings, getter", () => {
    mockedWorkspace.colorTheme = "mock-theme";
    mockedWorkspace.credentialMethod = "mock-credential-method";
    mockedWorkspace.defaultLocation = "mock-default-location";
    mockedWorkspace.defaultRegion = "mock-default-region";
    mockedWorkspace.extensionEnabled = "mock-extension-enabled";
    mockedWorkspace.macOsTerminal = "mock-terminal";
    mockedWorkspace.pluginsStatus = "mock-plugin-status";
    mockedWorkspace.samlRoleSessionDuration = "mock-saml-role-session-duration";
    mockedWorkspace.pinned = "mock-pinned";
    mockedWorkspace.segments = "mock-segments";
    mockedWorkspace.ssmRegionBehaviour = "mock-ssm-region-behaviour";
    repository.getWorkspace = jest.fn(() => mockedWorkspace);

    const result = repository.globalSettings;
    expect(repository.getWorkspace).toHaveBeenCalled();
    expect(result).toEqual({
      colorTheme: "mock-theme",
      credentialMethod: "mock-credential-method",
      defaultLocation: "mock-default-location",
      defaultRegion: "mock-default-region",
      extensionEnabled: "mock-extension-enabled",
      macOsTerminal: "mock-terminal",
      notifications: mockedNotifications,
      pluginsStatus: "mock-plugin-status",
      remoteWorkspacesSettingsMap: {},
      requirePassword: undefined,
      samlRoleSessionDuration: "mock-saml-role-session-duration",
      pinned: "mock-pinned",
      segments: "mock-segments",
      ssmRegionBehaviour: "mock-ssm-region-behaviour",
      touchIdEnabled: undefined,
    });
  });

  test("globalSettings, setter", () => {
    const mockedGlobalSettings = {
      colorTheme: "mock-theme",
      credentialMethod: "mock-credential-method",
      defaultLocation: "mock-default-location",
      defaultRegion: "mock-default-region",
      extensionEnabled: "mock-extension-enabled",
      macOsTerminal: "mock-terminal",
      pluginsStatus: "mock-plugin-status",
      samlRoleSessionDuration: "mock-saml-role-session-duration",
      pinned: "mock-pinned",
      segments: "mock-segments",
      ssmRegionBehaviour: "mock-ssm-region-behaviour",
      remoteWorkspacesSettingsMap: { "team-id-user-id": { "session-id": { region: "region", profileName: "profile-name" } } },
    };
    repository.getWorkspace = jest.fn(() => mockedWorkspace);
    repository.persistWorkspace = jest.fn(() => mockedWorkspace);

    repository.globalSettings = mockedGlobalSettings;
    expect(repository.getWorkspace).toHaveBeenCalled();
    expect(mockedWorkspace.colorTheme).toEqual("mock-theme");
    expect(mockedWorkspace.credentialMethod).toEqual("mock-credential-method");
    expect(mockedWorkspace.defaultLocation).toEqual("mock-default-location");
    expect(mockedWorkspace.defaultRegion).toEqual("mock-default-region");
    expect(mockedWorkspace.extensionEnabled).toEqual("mock-extension-enabled");
    expect(mockedWorkspace.macOsTerminal).toEqual("mock-terminal");
    expect(mockedWorkspace.pluginsStatus).toEqual("mock-plugin-status");
    expect(mockedWorkspace.samlRoleSessionDuration).toEqual("mock-saml-role-session-duration");
    expect(mockedWorkspace.pinned).toEqual("mock-pinned");
    expect(mockedWorkspace.segments).toEqual("mock-segments");
    expect(mockedWorkspace.ssmRegionBehaviour).toEqual("mock-ssm-region-behaviour");
    expect(mockedWorkspace.remoteWorkspacesSettingsMap).toEqual({
      "team-id-user-id": { "session-id": { region: "region", profileName: "profile-name" } },
    });
    expect(repository.persistWorkspace).toHaveBeenCalled();
  });

  test("getNotifications() - returns the notification array", () => {
    const notifications = repository.getNotifications();
    expect(notifications).toBe(mockedNotifications);
  });

  test("setNotifications() - set the notification array", () => {
    repository.setNotifications(mockedNotifications);
    expect(mockedNotifications).toBe(repository.getNotifications());
  });
});
