import { describe, jest, expect, test } from "@jest/globals";
import { RetroCompatibilityService } from "./retro-compatibility-service";
import { SessionType } from "../models/session-type";
import { IntegrationType } from "../models/integration-type";
import { Workspace } from "../models/workspace";
import * as uuid from "uuid";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";
import { constants } from "../models/constants";
jest.mock("uuid");

describe("RetroCompatibilityService", () => {
  let service: RetroCompatibilityService;

  describe("applyWorkspaceMigrations", () => {
    test("should skip migrations if lock file is not present", async () => {
      const fileService = {
        existsSync: () => false,
        homeDir: () => "",
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      (service as any).isRetroPatchNecessary = jest.fn();
      (service as any).adaptOldWorkspaceFile = jest.fn();
      (service as any).isIntegrationPatchNecessary = jest.fn();
      (service as any).adaptIntegrationPatch = jest.fn();
      (service as any).migration1 = jest.fn();

      await service.applyWorkspaceMigrations();

      expect((service as any).isRetroPatchNecessary).not.toHaveBeenCalled();
      expect((service as any).adaptOldWorkspaceFile).not.toHaveBeenCalled();
      expect((service as any).isIntegrationPatchNecessary).not.toHaveBeenCalled();
      expect((service as any).adaptIntegrationPatch).not.toHaveBeenCalled();
      expect((service as any).migration1).not.toHaveBeenCalled();
    });

    test("should try migrations if lock file is present", async () => {
      const fileService = {
        existsSync: () => true,
        homeDir: () => "",
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      (service as any).isRetroPatchNecessary = () => true;
      (service as any).adaptOldWorkspaceFile = jest.fn();
      (service as any).isIntegrationPatchNecessary = () => true;
      (service as any).adaptIntegrationPatch = jest.fn();
      (service as any).migration1 = jest.fn();

      await service.applyWorkspaceMigrations();

      expect((service as any).adaptOldWorkspaceFile).toHaveBeenCalled();
      expect((service as any).adaptIntegrationPatch).toHaveBeenCalled();
      expect((service as any).migration1).toHaveBeenCalled();
    });
  });

  describe("isRetroPatchNecessary", () => {
    test("should return true if a specific key is present in the file", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({ defaultWorkspace: "default" }),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isRetroPatchNecessary()).toEqual(true);
    });

    test("should return false if key is not there", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({}),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isRetroPatchNecessary()).toEqual(false);
    });
  });

  describe("isIntegrationPatchNecessary", () => {
    test("should return true if a specific key is not present in the file", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({}),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isIntegrationPatchNecessary()).toEqual(true);
    });

    test("should return true if there are ssoRole sessions but not sso integrations", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({ _awsSsoIntegrations: [], _sessions: [{ type: SessionType.awsSsoRole }] }),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isIntegrationPatchNecessary()).toEqual(true);
    });

    test("should return false otherwise", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({ _awsSsoIntegrations: [], _sessions: [] }),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isIntegrationPatchNecessary()).toEqual(false);
    });
  });

  describe("migration1", () => {
    test("should not migrate if _workspaceVersion is set", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({ _workspaceVersion: "someVersion" }),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      (service as any).persists = jest.fn();

      (service as any).migration1();
      expect((service as any).persists).not.toHaveBeenCalled();
    });

    test("should migrate if _workspaceVersion is not set", () => {
      let persistedWorkspace: any;

      const fakeOldIntegration = {
        id: "fakeId",
        alias: "fakeAlias",
        portalUrl: "fakePortalUrl",
        region: "fakeRegion",
        browserOpening: "fakeBrowserOpening",
        accessTokenExpiration: "fakeAccessTokenExpiration",
      } as any;

      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) =>
          JSON.stringify({
            _awsSsoIntegrations: [fakeOldIntegration],
            _sessions: [
              { type: "notAzure" },
              { type: SessionType.azure, tenantId: "fakeTenant1" },
              { type: SessionType.azure, tenantId: "fakeTenant2" },
              { type: SessionType.azure, tenantId: "fakeTenant2" },
            ],
            defaultLocation: "fakeLocation",
          }),
      } as any;

      const repository = {
        reloadWorkspace: jest.fn(),
        listAwsSsoIntegrations: () => ["ssoIntegration"],
        listAzureIntegrations: () => ["azureIntegration"],
      } as any;

      const behaviouralSubjectService = {
        setIntegrations: jest.fn(),
      } as any;

      service = new RetroCompatibilityService(fileService, null, repository, behaviouralSubjectService);
      (service as any).persists = jest.fn((workspace) => (persistedWorkspace = workspace));

      (service as any).migration1();

      expect(persistedWorkspace._workspaceVersion).toBe(1);

      expect(persistedWorkspace._awsSsoIntegrations.length).toBe(1);
      const migratedIntegration = persistedWorkspace._awsSsoIntegrations[0];
      expect(migratedIntegration).toMatchObject(fakeOldIntegration);
      expect(migratedIntegration.isOnline).toBe(false);
      expect(migratedIntegration.type).toBe(IntegrationType.awsSso);

      expect(persistedWorkspace._sessions.length).toBe(1);
      expect(persistedWorkspace._sessions[0]).toEqual({ type: "notAzure" });

      expect(persistedWorkspace._azureIntegrations.length).toBe(2);
      expect(persistedWorkspace._azureIntegrations[0]).toMatchObject({
        alias: "AzureIntgr-1",
        isOnline: false,
        region: "fakeLocation",
        tenantId: "fakeTenant1",
        type: IntegrationType.azure,
      });
      expect(persistedWorkspace._azureIntegrations[1]).toMatchObject({
        alias: "AzureIntgr-2",
        isOnline: false,
        region: "fakeLocation",
        tenantId: "fakeTenant2",
        type: IntegrationType.azure,
      });

      expect(repository.reloadWorkspace).toHaveBeenCalled();
      expect(behaviouralSubjectService.setIntegrations).toHaveBeenCalledWith(["ssoIntegration", "azureIntegration"]);
    });
  });

  test("adaptIntegrations", async () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "fake-uuid");
    const oldWOrkspace = {
      _idpUrls: [{ idpUrlId: "idpUrlId" }],
      _profiles: [{ profileid: "profileId", name: "default" }],
      _proxyConfiguration: [],
      _defaultRegion: "eu-west-1",
      _defaultLocation: "useast1",
      _awsSsoConfiguration: {},
    };

    const keyChainService = {
      getSecret: jest.fn(() => "mocked-access-token"),
      saveSecret: jest.fn(),
    } as any;
    const workspace = new Workspace();

    const retrocompatibilityService = new RetroCompatibilityService(null, keyChainService, null, null);
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);

    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);
    oldWOrkspace._awsSsoConfiguration = undefined;
    (oldWOrkspace as any).awsSsoConfiguration = {};
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);
    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);

    oldWOrkspace._awsSsoConfiguration = {};
    workspace.awsSsoIntegrations = undefined;
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);
    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);

    oldWOrkspace._awsSsoConfiguration = {
      portalUrl: "portal-url",
      region: "fake-region",
      expirationTime: "now",
    };
    workspace.awsSsoIntegrations = [];
    workspace.sessions.push({
      sessionName: "name",
      sessionId: "1",
      region: "eu-west-1",
      sessionTokenExpiration: "",
      startDateTime: "",
      status: undefined,
      expired: () => false,
      type: SessionType.awsSsoRole,
    });
    workspace.sessions.push({
      sessionName: "name2",
      sessionId: "2",
      region: "eu-west-1",
      sessionTokenExpiration: "",
      startDateTime: "",
      status: undefined,
      expired: () => false,
      type: SessionType.awsIamRoleFederated,
    });

    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);
    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);
    expect(workspace.awsSsoIntegrations[0]).toStrictEqual(
      new AwsSsoIntegration("fake-uuid", "Aws Single Sign-On", "portal-url", "fake-region", constants.inApp, "now")
    );
    expect(workspace.sessions[0]["awsSsoConfigurationId"]).toBe("fake-uuid");
    expect(keyChainService.saveSecret).toHaveBeenCalledWith(constants.appName, "aws-sso-integration-access-token-fake-uuid", "mocked-access-token");
    expect(keyChainService.getSecret).toHaveBeenCalledWith(constants.appName, `aws-sso-access-token`);
  });

  test("adaptIntegrations - throws an error", async () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "fake-uuid");
    const oldWOrkspace = {
      _idpUrls: [{ idpUrlId: "idpUrlId" }],
      _profiles: [{ profileid: "profileId", name: "default" }],
      _proxyConfiguration: [],
      _defaultRegion: "eu-west-1",
      _defaultLocation: "useast1",
      _awsSsoConfiguration: {},
    };

    const keyChainService = {
      getSecret: jest.fn(() => "mocked-access-token"),
      saveSecret: jest.fn(),
    } as any;
    const workspace = new Workspace();

    let retrocompatibilityService = new RetroCompatibilityService(null, keyChainService, null, null);
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);

    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);
    oldWOrkspace._awsSsoConfiguration = undefined;
    (oldWOrkspace as any).awsSsoConfiguration = {};
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);
    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);

    oldWOrkspace._awsSsoConfiguration = {};
    workspace.awsSsoIntegrations = undefined;
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);
    expect(workspace.idpUrls).toStrictEqual(oldWOrkspace._idpUrls);

    oldWOrkspace._awsSsoConfiguration = {
      portalUrl: "portal-url",
      region: "fake-region",
      expirationTime: "now",
    };
    workspace.awsSsoIntegrations = [];
    workspace.sessions.push({
      sessionName: "name",
      sessionId: "1",
      region: "eu-west-1",
      sessionTokenExpiration: "",
      startDateTime: "",
      status: undefined,
      expired: () => false,
      type: SessionType.awsSsoRole,
    });
    workspace.sessions.push({
      sessionName: "name2",
      sessionId: "2",
      region: "eu-west-1",
      sessionTokenExpiration: "",
      startDateTime: "",
      status: undefined,
      expired: () => false,
      type: SessionType.awsIamRoleFederated,
    });
    keyChainService.getSecret = jest.fn(() => {
      throw new Error();
    });
    retrocompatibilityService = new RetroCompatibilityService(null, keyChainService, null, null);
    jest.spyOn(console, "log");
    await (retrocompatibilityService as any).adaptIntegrations(oldWOrkspace, workspace);
    expect(console.log).toHaveBeenCalledWith("no need to save access token");
  });

  test("adaptIntegrationPatch", async () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "fake-uuid");
    const workspace = {
      fakeKey: "fakeValue",
    };
    const fileService = {
      writeFileSync: jest.fn(),
      homeDir: jest.fn(() => "/home"),
      encryptText: jest.fn((_workspace) => JSON.stringify(_workspace)),
    } as any;
    const repository = {
      workspace: {},
    } as any;
    const behaviouralSubjectService = {
      sessions: {},
    } as any;
    const retrocompatibilityService = new RetroCompatibilityService(fileService, null, repository, behaviouralSubjectService);
    (retrocompatibilityService as any).getWorkspace = jest.fn(() => workspace);
    (retrocompatibilityService as any).persists = jest.fn();
    (retrocompatibilityService as any).adaptIntegrations = jest.fn();

    await (retrocompatibilityService as any).adaptIntegrationPatch();

    expect((retrocompatibilityService as any).getWorkspace).toHaveBeenCalled();
    expect((retrocompatibilityService as any).persists).toHaveBeenCalledWith(new Workspace());
    expect((retrocompatibilityService as any).adaptIntegrations).toHaveBeenCalledWith(workspace, new Workspace());
    expect(behaviouralSubjectService.sessions).toStrictEqual(new Workspace().sessions);
    expect(repository.workspace).toStrictEqual(new Workspace());
  });

  test("persistsTemp", () => {
    const workspace = {
      fakeKey: "fakeValue",
    };
    const fileService = {
      writeFileSync: jest.fn(),
      homeDir: jest.fn(() => "/home"),
      encryptText: jest.fn((_workspace) => JSON.stringify(_workspace)),
    } as any;
    const retrocompatibilityService = new RetroCompatibilityService(fileService, null, null, null);
    (retrocompatibilityService as any).persistsTemp(workspace);
    jest.spyOn(retrocompatibilityService as any, "lockFilePath", "get");
    expect((retrocompatibilityService as any).lockFilePath).toBe("/home/.Leapp/Leapp-lock.json");
    expect(fileService.writeFileSync).toHaveBeenCalledWith("/home/.Leapp/Leapp-lock.json", '"{\\"fakeKey\\":\\"fakeValue\\"}"');
  });

  test("persists", () => {
    const workspace = {
      fakeKey: "fakeValue",
    };
    const fileService = {
      writeFileSync: jest.fn(),
      homeDir: jest.fn(() => "/home"),
      encryptText: jest.fn((_workspace) => JSON.stringify(_workspace)),
    } as any;
    const retrocompatibilityService = new RetroCompatibilityService(fileService, null, null, null);
    (retrocompatibilityService as any).persists(workspace);
    jest.spyOn(retrocompatibilityService as any, "lockFilePath", "get");
    expect((retrocompatibilityService as any).lockFilePath).toBe("/home/.Leapp/Leapp-lock.json");
    expect(fileService.writeFileSync).toHaveBeenCalledWith("/home/.Leapp/Leapp-lock.json", '"{\\"fakeKey\\":\\"fakeValue\\"}"');
  });
});
