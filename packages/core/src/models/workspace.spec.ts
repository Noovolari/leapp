import { describe, expect, jest, test } from "@jest/globals";
import { Workspace } from "./workspace";
import { IdpUrl } from "./idp-url";
import { constants } from "./constants";
import * as uuid from "uuid";
import { LeappNotification, LeappNotificationType } from "./notification";

jest.mock("uuid");

describe("Workspace Model", () => {
  test("if changing a field in the workspace class, warn about workspace version", () => {
    const workspace = new Workspace();
    const stringifiedWorkspace = JSON.stringify(workspace);
    try {
      expect(stringifiedWorkspace).toEqual(
        '{"_sessions":[],"_awsSsoIntegrations":[],"_azureIntegrations":[],"_defaultRegion":"us-east-1",' +
          '"_defaultLocation":"eastus","_macOsTerminal":"Terminal","_idpUrls":[],"_profiles":[{"name":"default"}],' +
          '"_remoteWorkspacesSettingsMap":{},' +
          '"_notifications":[],"_pluginsStatus":[],"_pinned":[],"_folders":[],"_segments":[],"_extensionEnabled":false,' +
          '"_proxyConfiguration":{"proxyProtocol":"https","proxyPort":"8080"},' +
          '"_credentialMethod":"credential-file-method","_samlRoleSessionDuration":3600,"_ssmRegionBehaviour":"No"}'
      );
    } catch (err) {
      console.log(err);
      throw new Error(
        "This test fails meaning you need to create a new migration for the workspace since you changed its properties, " +
          "and then increase the workspace version in constants.workspaceVersion"
      );
    }
  });

  test("should create", () => {
    const workspace = new Workspace();
    expect(workspace).toBeTruthy();
    expect(workspace).toBeInstanceOf(Workspace);
  });

  test("addIdpUrl()", () => {
    const idpUrl: IdpUrl = {
      id: "fake-id",
      url: "fake-url",
    };
    const workspace = new Workspace();
    workspace.addIpUrl(idpUrl);
    expect(workspace.idpUrls).toContain(idpUrl);
  });

  test("get macOSTerminal", () => {
    const workspace = new Workspace();
    //const macOsTerminalGetterSpy = jest.spyOn(workspace, "macOsTerminal", "get");
    expect(workspace.macOsTerminal).toEqual(constants.macOsTerminal);
  });

  test("set macOSTerminal", () => {
    const workspace = new Workspace();
    const macOsTerminalSetterSpy = jest.spyOn(workspace, "macOsTerminal", "set");
    workspace.macOsTerminal = constants.macOsIterm2;
    expect(macOsTerminalSetterSpy).toHaveBeenCalledTimes(1);
    expect(workspace.macOsTerminal).toEqual(constants.macOsIterm2);
  });

  test("get idpUrls", () => {
    const workspace = new Workspace();
    expect(workspace.idpUrls).toEqual([]);
  });

  test("set idpUrls", () => {
    const idpUrl: IdpUrl = {
      id: "fake-id",
      url: "fake-url",
    };
    const workspace = new Workspace();
    const idpUrlsSetterSpy = jest.spyOn(workspace, "idpUrls", "set");
    workspace.idpUrls = [idpUrl];
    expect(idpUrlsSetterSpy).toHaveBeenCalledTimes(1);
    expect(workspace.idpUrls).toEqual([idpUrl]);
  });

  test("get profiles", () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    const workspace = new Workspace();
    expect(workspace.profiles).toEqual([
      {
        id: "mocked-uuid",
        name: "default",
      },
    ]);
  });

  test("set profiles", () => {
    const workspace = new Workspace();
    const profilesSetterSpy = jest.spyOn(workspace, "profiles", "set");
    workspace.profiles = [
      {
        id: "mocked-uuid",
        name: "default",
      },
      {
        id: "mocked-uuid-2",
        name: "fake-profile-name",
      },
    ];
    expect(profilesSetterSpy).toHaveBeenCalledTimes(1);
    expect(workspace.profiles).toEqual([
      {
        id: "mocked-uuid",
        name: "default",
      },
      {
        id: "mocked-uuid-2",
        name: "fake-profile-name",
      },
    ]);
  });

  test("setNewWorkspaceVersion", () => {
    const workspace = new Workspace();
    workspace.setNewWorkspaceVersion();
    expect((workspace as any)._workspaceVersion).toBe(7);
  });

  test("get Sessions", () => {
    const workspace = new Workspace();
    expect(workspace.sessions).toBe((workspace as any)._sessions);
  });

  test("set Sessions", () => {
    const workspace = new Workspace();
    const session = { sessionId: 1 } as any;
    workspace.sessions = [session];
    expect([session]).toStrictEqual((workspace as any)._sessions);
  });

  test("proxyConfiguration", () => {
    const workspace = new Workspace();
    expect(workspace.proxyConfiguration).toStrictEqual((workspace as any)._proxyConfiguration);
  });

  test("set proxyConfiguration", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.proxyConfiguration = mock;
    expect(mock).toStrictEqual((workspace as any)._proxyConfiguration);
  });

  test("defaultRegion", () => {
    const workspace = new Workspace();
    expect(workspace.defaultRegion).toStrictEqual((workspace as any)._defaultRegion);
  });

  test("set defaultRegion", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.defaultRegion = mock;
    expect(mock).toStrictEqual((workspace as any)._defaultRegion);
  });

  test("defaultLocation", () => {
    const workspace = new Workspace();
    expect(workspace.defaultLocation).toStrictEqual((workspace as any)._defaultLocation);
  });

  test("set defaultLocation", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.defaultLocation = mock;
    expect(mock).toStrictEqual((workspace as any)._defaultLocation);
  });

  test("awsSsoIntegrations", () => {
    const workspace = new Workspace();
    expect(workspace.awsSsoIntegrations).toStrictEqual((workspace as any)._awsSsoIntegrations);
  });

  test("set awsSsoIntegrations", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.awsSsoIntegrations = mock;
    expect(mock).toStrictEqual((workspace as any)._awsSsoIntegrations);
  });

  test("azureIntegrations", () => {
    const workspace = new Workspace();
    expect(workspace.azureIntegrations).toStrictEqual((workspace as any)._azureIntegrations);
  });

  test("set azureIntegrations", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.azureIntegrations = mock;
    expect(mock).toStrictEqual((workspace as any)._azureIntegrations);
  });

  test("pinned", () => {
    const workspace = new Workspace();
    expect(workspace.pinned).toStrictEqual((workspace as any)._pinned);
  });

  test("set pinned", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.pinned = mock;
    expect(mock).toStrictEqual((workspace as any)._pinned);
  });

  test("folders", () => {
    const workspace = new Workspace();
    expect(workspace.folders).toStrictEqual((workspace as any)._folders);
  });

  test("set folders", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.folders = mock;
    expect(mock).toStrictEqual((workspace as any)._folders);
  });

  test("segments", () => {
    const workspace = new Workspace();
    expect(workspace.segments).toStrictEqual((workspace as any)._segments);
  });

  test("set segments", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.segments = mock;
    expect(mock).toStrictEqual((workspace as any)._segments);
  });

  test("colorTheme", () => {
    const workspace = new Workspace();
    expect(workspace.colorTheme).toStrictEqual((workspace as any)._colorTheme);
  });

  test("set colorTheme", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.colorTheme = mock;
    expect(mock).toStrictEqual((workspace as any)._colorTheme);
  });

  test("credentialMethod", () => {
    const workspace = new Workspace();
    expect(workspace.credentialMethod).toStrictEqual((workspace as any)._credentialMethod);
  });

  test("set credentialMethod", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.credentialMethod = mock;
    expect(mock).toStrictEqual((workspace as any)._credentialMethod);
  });

  test("pluginStatus", () => {
    const workspace = new Workspace();
    expect(workspace.pluginsStatus).toStrictEqual([]);
  });

  test("set pluginStatus", () => {
    const workspace = new Workspace();
    const mock = "plugin-status" as any;
    workspace.pluginsStatus = mock;
    expect(mock).toStrictEqual((workspace as any)._pluginsStatus);
  });

  test("samlRoleSessionDuration", () => {
    const workspace = new Workspace();
    expect(workspace.samlRoleSessionDuration).toStrictEqual((workspace as any)._samlRoleSessionDuration);
  });

  test("set samlRoleSessionDuration", () => {
    const workspace = new Workspace();
    const mock = { mock: "mock" } as any;
    workspace.samlRoleSessionDuration = mock;
    expect(mock).toStrictEqual((workspace as any)._samlRoleSessionDuration);
  });

  test("ssmRegionBehaviour", () => {
    const workspace = new Workspace();
    expect(workspace.ssmRegionBehaviour).toStrictEqual((workspace as any)._ssmRegionBehaviour);
  });

  test("set ssmRegionBehaviour", () => {
    const workspace = new Workspace();
    const mock = "any";
    workspace.ssmRegionBehaviour = mock;
    expect(mock).toStrictEqual((workspace as any)._ssmRegionBehaviour);
  });

  test("extensionEnabled", () => {
    const workspace = new Workspace();
    expect(workspace.extensionEnabled).toStrictEqual((workspace as any)._extensionEnabled);
  });

  test("set extensionEnabled", () => {
    const workspace = new Workspace();
    const mock = false;
    workspace.extensionEnabled = mock;
    expect(mock).toStrictEqual((workspace as any)._extensionEnabled);
  });

  test("get notifications", () => {
    const workspace = new Workspace();
    const fakeNotifications = [new LeappNotification("fake-uuid", LeappNotificationType.info, "title", "descr", false)];
    (workspace as any)._notifications = fakeNotifications;
    expect(workspace.notifications).toEqual(fakeNotifications);
  });

  test("set notifications", () => {
    const workspace = new Workspace();
    const fakeNotifications = [new LeappNotification("fake-uuid", LeappNotificationType.info, "title", "descr", false)];
    const notificationSpy = jest.spyOn(workspace, "notifications", "set");
    workspace.notifications = fakeNotifications;
    expect(notificationSpy).toHaveBeenCalledTimes(1);
    expect(workspace.notifications).toEqual(fakeNotifications);
  });
});
