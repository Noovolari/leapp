import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { constants } from "./constants";
import { currentFlavor } from "./flavor";
import { LeappBaseError } from "../errors/leapp-base-error";

describe("build flavors: constants", () => {
  let savedFlavor: string | undefined;

  beforeEach(() => {
    savedFlavor = process.env.LEAPP_FLAVOR;
  });

  afterEach(() => {
    if (savedFlavor === undefined) {
      delete process.env.LEAPP_FLAVOR;
    } else {
      process.env.LEAPP_FLAVOR = savedFlavor;
    }
  });

  test("with LEAPP_FLAVOR unset every flavor-dependent constant keeps its prod value", () => {
    delete process.env.LEAPP_FLAVOR;

    expect(currentFlavor()).toBe("prod");
    expect(constants.appName).toBe("Leapp");
    expect(constants.leappDir).toBe(".Leapp");
    expect(constants.rsaBinFileDestination).toBe(".Leapp/rsa.bin");
    expect(constants.lockFileDestination).toBe(".Leapp/Leapp-lock.json");
    expect(constants.lockFileBackupPath).toBe(".Leapp/Leapp-lock.backup.bin");
    expect(constants.ssmSourceFileDestination).toBe(".Leapp/ssm-env");
    expect(constants.pluginEnvFileDestination).toBe(".Leapp/plugin-env");
    expect(constants.deeplinkFile).toBe(".Leapp/deeplink");
    expect(constants.ipcServerId).toBe("leapp_da");
    expect(constants.ipcClientId).toBe("leapp_cli");
    expect(constants.extensionWebSocketPort).toBe(8095);
    expect(constants.cliBinaryName).toBe("leapp");
    expect(constants.productName).toBe("Leapp");
    expect(constants.urlScheme).toBe("leapp");
  });

  test("LEAPP_FLAVOR=prod gives the same values as unset", () => {
    process.env.LEAPP_FLAVOR = "prod";

    expect(currentFlavor()).toBe("prod");
    expect(constants.appName).toBe("Leapp");
    expect(constants.lockFileDestination).toBe(".Leapp/Leapp-lock.json");
    expect(constants.ipcServerId).toBe("leapp_da");
  });

  test("with LEAPP_FLAVOR=dev every flavor-dependent constant takes its dev value", () => {
    process.env.LEAPP_FLAVOR = "dev";

    expect(currentFlavor()).toBe("dev");
    expect(constants.appName).toBe("Leapp-dev");
    expect(constants.leappDir).toBe(".Leapp-dev");
    expect(constants.rsaBinFileDestination).toBe(".Leapp-dev/rsa.bin");
    expect(constants.lockFileDestination).toBe(".Leapp-dev/Leapp-lock.json");
    expect(constants.lockFileBackupPath).toBe(".Leapp-dev/Leapp-lock.backup.bin");
    expect(constants.ssmSourceFileDestination).toBe(".Leapp-dev/ssm-env");
    expect(constants.pluginEnvFileDestination).toBe(".Leapp-dev/plugin-env");
    expect(constants.deeplinkFile).toBe(".Leapp-dev/deeplink");
    expect(constants.ipcServerId).toBe("leapp_da-dev");
    expect(constants.ipcClientId).toBe("leapp_cli-dev");
    expect(constants.extensionWebSocketPort).toBe(8096);
    expect(constants.cliBinaryName).toBe("leapp-dev");
    expect(constants.productName).toBe("Leapp Dev");
    expect(constants.urlScheme).toBe("leapp-dev");
  });

  test("flavor-independent constants are the same in dev", () => {
    process.env.LEAPP_FLAVOR = "dev";

    expect(constants.credentialsDestination).toBe(".aws/credentials");
    expect(constants.workspaceLastVersion).toBe(7);
    expect(constants.defaultRegion).toBe("us-east-1");
  });

  test("with LEAPP_FLAVOR=qa every flavor-dependent constant takes its qa value", () => {
    process.env.LEAPP_FLAVOR = "qa";

    expect(currentFlavor()).toBe("qa");
    expect(constants.appName).toBe("Leapp-qa");
    expect(constants.leappDir).toBe(".Leapp-qa");
    expect(constants.lockFileDestination).toBe(".Leapp-qa/Leapp-lock.json");
    expect(constants.deeplinkFile).toBe(".Leapp-qa/deeplink");
    expect(constants.ipcServerId).toBe("leapp_da-qa");
    expect(constants.ipcClientId).toBe("leapp_cli-qa");
    expect(constants.extensionWebSocketPort).toBe(8097);
    expect(constants.cliBinaryName).toBe("leapp-qa");
    expect(constants.productName).toBe("Leapp QA");
    expect(constants.urlScheme).toBe("leapp-qa");
  });

  test("an unknown LEAPP_FLAVOR is refused instead of falling back to prod", () => {
    process.env.LEAPP_FLAVOR = "staging";

    expect(() => currentFlavor()).toThrow(LeappBaseError);
    expect(() => constants.appName).toThrow("Unknown LEAPP_FLAVOR 'staging': use prod, dev or qa");
    expect(() => constants.lockFileDestination).toThrow("Unknown LEAPP_FLAVOR 'staging': use prod, dev or qa");
  });
});
