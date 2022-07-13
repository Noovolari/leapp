import { describe, test, expect } from "@jest/globals";
import { Workspace } from "./workspace";
import { IdpUrl } from "./idp-url";
import { constants } from "./constants";
import * as uuid from "uuid";
jest.mock("uuid");

describe("Workspace Model", () => {
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
});
