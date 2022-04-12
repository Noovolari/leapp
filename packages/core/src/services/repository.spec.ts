import { describe, test } from "@jest/globals";
import { Repository } from "./repository";
import { FileService } from "./file-service";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";
import { Session } from "../models/session";
import { SessionType } from "../models/session-type";
import { SessionStatus } from "../models/session-status";
import { LeappNotFoundError } from "../errors/leapp-not-found-error";
import { AwsSsoRoleSession } from "../models/aws-sso-role-session";

describe("Repository", () => {
  let mockedWorkspace;
  let mockedNativeService;
  let mockedFileService;
  let repository;
  let mockedSession: Session;

  beforeEach(() => {
    mockedWorkspace = new Workspace();

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

    mockedFileService = new FileService(mockedNativeService);
    mockedFileService.readFileSync = jest.fn();
    mockedFileService.writeFileSync = jest.fn(() => {});
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(mockedWorkspace));
    mockedFileService.existsSync = jest.fn(() => false);
    mockedFileService.newDir = jest.fn();

    repository = new Repository(mockedNativeService, mockedFileService);
    (repository as any)._workspace = mockedWorkspace;

    mockedSession = {
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

  test("createWorkspace() - create a new workspace", () => {
    repository.persistWorkspace = jest.fn();
    repository.createWorkspace();
    expect(repository.workspace).not.toBe(null);
    expect(repository.persistWorkspace).toHaveBeenCalledWith((repository as any)._workspace);
  });

  test("getWorkspace() - to be the same as the getter property and the private variable", () => {
    repository.persistWorkspace = jest.fn();
    repository.createWorkspace();

    expect(repository.workspace).not.toBe(null);
    expect(repository.persistWorkspace).toHaveBeenCalledWith((repository as any)._workspace);
    expect(repository.getWorkspace()).toBe(repository.workspace);
    expect(repository.getWorkspace()).toBe((repository as any)._workspace);
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

  test("addSession() - add a new session to the array of sessions", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
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
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
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
    expect(repository.getSessions()).toStrictEqual([mockedSession2]);
  });

  test("updateSessions() - bulk updates all sessions at once", () => {
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    const mockedSession2: Session = {
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

  test("listIamRoleChained() - list sessions of type AwsIamRoleChained", () => {
    mockedSession.type = SessionType.awsIamRoleChained;
    const workspace = new Workspace();
    workspace.sessions = [mockedSession];

    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listIamRoleChained()).toStrictEqual([mockedSession]);

    mockedSession.type = SessionType.azure;
    workspace.sessions = [mockedSession];

    expect(repository.listIamRoleChained()).toStrictEqual([]);
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

    expect(workspace.profiles.length).toBeGreaterThan(0);
    expect(workspace.profiles.length).toBe(1);

    const defaultProfile = workspace.profiles[0];
    expect(repository.getDefaultProfileId()).toStrictEqual(defaultProfile.id);
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
    expect(() => repository.getProfileName("2345")).toThrow(LeappNotFoundError);
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
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
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
        expired: () => false,
      },
      {
        sessionId: "34",
        sessionName: "session3",
        type: SessionType.awsSsoRole,
        status: SessionStatus.inactive,
        region: "eu-west-1",
        expired: () => false,
      },
    ];

    workspace.awsSsoIntegrations = [
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
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
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
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
      { id: "1234", alias: "1", region: "a", accessTokenExpiration: "", browserOpening: "", portalUrl: "" },
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

  test("unsetAwsSsoIntegrationExpiration() - put accessTokenExpiration to undefined", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.awsSsoIntegrations = [{ id: "1234", alias: "1", region: "a", accessTokenExpiration: "1000", browserOpening: "", portalUrl: "" }];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(1);

    repository.unsetAwsSsoIntegrationExpiration("1234");

    expect(repository.listAwsSsoIntegrations().length).toBe(1);
    expect(repository.listAwsSsoIntegrations()[0].accessTokenExpiration).toBe(undefined);
  });

  test("deleteAwsSsoIntegration() - remove an integration from the workspace", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    workspace.awsSsoIntegrations = [{ id: "1234", alias: "1", region: "a", accessTokenExpiration: "1000", browserOpening: "", portalUrl: "" }];
    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(repository.listAwsSsoIntegrations().length).toBe(1);

    repository.deleteAwsSsoIntegration("1234");

    expect(repository.listAwsSsoIntegrations().length).toBe(0);
    expect(repository.listAwsSsoIntegrations()[0]).toBe(undefined);
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

  test("pinSession() - set a session as favourite", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.pinned = [];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.pinned.length).toBe(0);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    repository.pinSession({ sessionId: "1234" });

    expect(workspace.pinned.length).toBe(1);
    expect(workspace.pinned[0]).toBe("1234");
  });

  test("unpinSession() - unset a session as favourite", () => {
    const workspace = new Workspace();
    mockedFileService.encryptText = jest.fn(() => JSON.stringify(workspace));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    workspace.pinned = ["1234"];

    repository.workspace = workspace;
    repository.persistWorkspace(workspace);

    expect(workspace.pinned.length).toBe(1);
    expect(workspace.pinned[0]).toBe("1234");

    repository.unpinSession({ sessionId: "1234" });
    expect(workspace.pinned.length).toBe(0);
    expect(workspace.pinned[0]).toBe(undefined);
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
});
