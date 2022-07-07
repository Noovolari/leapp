import { describe, it, jest, expect } from "@jest/globals";
import { RetroCompatibilityService } from "./retro-compatibility-service";
import { SessionType } from "../models/session-type";
import { IntegrationType } from "../models/integration-type";

describe("RetroCompatibilityService", () => {
  let service: RetroCompatibilityService;

  describe("applyWorkspaceMigrations", () => {
    it("should skip migrations if lock file is not present", async () => {
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

    it("should try migrations if lock file is present", async () => {
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
    it("should return true if a specific key is present in the file", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({ defaultWorkspace: "default" }),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isRetroPatchNecessary()).toEqual(true);
    });

    it("should return false if key is not there", () => {
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
    it("should return true if a specific key is not present in the file", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({}),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isIntegrationPatchNecessary()).toEqual(true);
    });

    it("should return true if there are ssoRole sessions but not sso integrations", () => {
      const fileService = {
        homeDir: () => "",
        decryptText: (text: string) => text,
        readFileSync: (_: string) => JSON.stringify({ _awsSsoIntegrations: [], _sessions: [{ type: SessionType.awsSsoRole }] }),
      } as any;

      service = new RetroCompatibilityService(fileService, null, null, null);
      expect((service as any).isIntegrationPatchNecessary()).toEqual(true);
    });

    it("should return false otherwise", () => {
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
    it("should not migrate if _workspaceVersion is set", () => {
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

    it("should migrate if _workspaceVersion is not set", () => {
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
});
