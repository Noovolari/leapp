import { describe, expect, jest, test } from "@jest/globals";
import { PluginContainer, PluginManagerService } from "./plugin-manager-service";
import { constants } from "../models/constants";
import { OperatingSystem } from "../models/operating-system";
import { SessionType } from "../models/session-type";
import { SessionFactory } from "../services/session-factory";
import { LoggedEntry, LoggedException, LogLevel } from "../services/log-service";
import { AwsCredentialsPlugin } from "./aws-credentials-plugin";

describe("PluginManagerService", () => {
  test("base64Decoding", () => {
    const result = (PluginManagerService as any).base64Decoding("fake-input");
    expect(result).toBeInstanceOf(Buffer);
  });

  test("pluginContainers", () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const expectedValue = ["fake-plugin"];
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any)._pluginContainers = expectedValue;
    const result = pluginManager.pluginContainers;
    expect(result).toStrictEqual(expectedValue);
  });

  test("getPluginByName", () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const plugins = [{ metadata: { uniqueName: "plugin-1" } }, { metadata: { uniqueName: "plugin-2" } }];
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any)._pluginContainers = plugins;
    const result = pluginManager.getPluginByName("plugin-2");
    expect(result).toStrictEqual({ metadata: { uniqueName: "plugin-2" } });
  });

  test("verifyAndGeneratePluginFolderIfMissing", () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
      fs: {
        existsSync: jest.fn(() => false),
        mkdirSync: jest.fn(),
      },
      os: {
        homedir: jest.fn(() => "homedir"),
      },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any)._pluginDir = "plugin-dir";
    pluginManager.verifyAndGeneratePluginFolderIfMissing();
    expect(nativeService.os.homedir).toHaveBeenCalled();
    expect(nativeService.fs.existsSync).toHaveBeenCalledWith("homedir" + "/.Leapp/" + "plugin-dir");
    expect(nativeService.fs.mkdirSync).toHaveBeenCalledWith("homedir" + "/.Leapp/" + "plugin-dir");
  });

  test("loadFromPluginDir", async () => {
    const pluginDir = "plugin-dir";
    const homedir = "homedir";
    const pluginDirContent = ["plugin-1", "plugin-2"];
    const options = {
      folders: { include: ["*.*"] },
      files: { exclude: ["signature", ".DS_Store", "package-lock.json"] },
    };
    const packageJson1 = {
      name: "plugin-1",
    };
    const packageJson2 = {
      name: "plugin-2",
    };
    const plugin1 = {
      metadata: {
        uniqueName: "plugin-1",
        active: true,
      },
    };
    const plugin2 = {
      metadata: {
        uniqueName: "plugin-2",
        active: true,
      },
    };
    const plugins = [plugin1, plugin2];
    const packagesJsons = [packageJson1, packageJson2];

    class PluginAction1 {}

    class PluginAction2 {}

    const nativeService = {
      requireModule: jest.fn(() => ({ action1: PluginAction1, action2: PluginAction2 })),
      hashElement: { hashElement: null },
      fs: {
        readdirSync: jest.fn(() => pluginDirContent),
        existsSync: jest.fn(
          (pluginFilePath) =>
            pluginFilePath === homedir + "/.Leapp/" + pluginDir + "/" + "plugin-1" ||
            pluginFilePath === homedir + "/.Leapp/" + pluginDir + "/" + "plugin-2" ||
            pluginFilePath === homedir + "/.Leapp/" + pluginDir + "/" + "plugin-1" + "/plugin.js" ||
            pluginFilePath === homedir + "/.Leapp/" + pluginDir + "/" + "plugin-2" + "/plugin.js"
        ),
        mkdirSync: jest.fn(),
        lstatSync: jest.fn(() => ({
          isDirectory: () => true,
        })),
      },
      os: {
        homedir: jest.fn(() => homedir),
      },
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const repository = {
      getPluginStatus: jest.fn(() => false),
      createPluginStatus: jest.fn(),
    } as any;
    const pluginEnvironment = "fake-plugin-environment" as any;

    const pluginManager = new PluginManagerService(pluginEnvironment, nativeService, logService, repository, null, null);
    (pluginManager as any)._pluginDir = "plugin-dir";
    (pluginManager as any).validatePlugin = jest.fn((_p1, _p2, pluginName) => ({
      packageJson: packagesJsons.find((packageJson) => packageJson.name === pluginName),
      isPluginValid: true,
    }));
    (pluginManager as any).extractMetadata = jest.fn((pkgjson: any) => plugins.find((data) => data.metadata.uniqueName === pkgjson.name).metadata);

    await pluginManager.loadFromPluginDir();

    expect(nativeService.fs.readdirSync).toHaveBeenCalledWith(homedir + "/.Leapp/" + pluginDir);
    expect(nativeService.os.homedir).toHaveBeenCalled();

    for (let i = 0; i < pluginDirContent.length; i++) {
      const pluginFilePath = homedir + "/.Leapp/" + pluginDir + "/" + pluginDirContent[i];
      expect(nativeService.fs.existsSync).toHaveBeenCalledWith(pluginFilePath);
      expect(nativeService.fs.lstatSync).toHaveBeenCalledWith(pluginFilePath);
      expect((pluginManager as any).validatePlugin).toHaveBeenCalledWith(pluginFilePath, options, pluginDirContent[i]);
      expect((pluginManager as any).extractMetadata).toHaveBeenCalledWith(packagesJsons[i]);
      expect(nativeService.fs.existsSync).toHaveBeenCalledWith(pluginFilePath + "/plugin.js");
      expect(repository.getPluginStatus).toHaveBeenCalledWith(plugins[i].metadata.uniqueName);
      expect(repository.createPluginStatus).toHaveBeenCalledWith(plugins[i].metadata.uniqueName);
      const pluginContainer = (pluginManager as any)._pluginContainers[i] as PluginContainer;
      expect(pluginContainer).toBeInstanceOf(PluginContainer);
      expect(pluginContainer.metadata).toStrictEqual(plugins[i].metadata);
      expect(pluginContainer).toBeInstanceOf(PluginContainer);
      expect(pluginContainer.pluginInstances.length).toBe(2);
      expect(pluginContainer.pluginInstances[0]).toBeInstanceOf(PluginAction1);
      expect(pluginContainer.pluginInstances[0].metadata).toStrictEqual(plugins[i].metadata);
      expect(pluginContainer.pluginInstances[1]).toBeInstanceOf(PluginAction2);
      expect(pluginContainer.pluginInstances[1].metadata).toStrictEqual(plugins[i].metadata);
      expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(`loading ${plugins[i].metadata.uniqueName} plugin`, this, LogLevel.info, false));
    }
  });

  test("loadFromPluginDir, extractMetadata throws an exception", async () => {
    const pluginDir = "plugin-dir";
    const homedir = "homedir";
    const pluginDirContent = ["plugin-1"];
    const packageJson1 = {};
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
      fs: {
        readdirSync: () => pluginDirContent,
        existsSync: (pluginFilePath) => pluginFilePath === homedir + "/.Leapp/" + pluginDir + "/" + "plugin-1",
        mkdirSync: () => {},
        lstatSync: () => ({
          isDirectory: () => true,
        }),
      },
      os: {
        homedir: () => homedir,
      },
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any)._pluginDir = "plugin-dir";
    (pluginManager as any).validatePlugin = () => ({ packageJson: packageJson1, isPluginValid: true });
    (pluginManager as any).extractMetadata = () => {
      throw new Error("error");
    };
    await pluginManager.loadFromPluginDir();
    expect(logService.log).toHaveBeenCalledWith(
      new LoggedEntry(`missing or invalid values in plugin plugin-1 package.json: error`, this, LogLevel.warn, true)
    );
  });

  test("loadFromPluginDir, invalid signature", async () => {
    const pluginDir = "plugin-dir";
    const homedir = "homedir";
    const pluginDirContent = ["plugin-1"];
    const packageJson1 = {};
    const path = homedir + "/.Leapp/" + pluginDir + "/" + "plugin-1";
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
      fs: {
        readdirSync: () => pluginDirContent,
        existsSync: (pluginFilePath) => pluginFilePath === path,
        mkdirSync: () => {},
        lstatSync: () => ({
          isDirectory: () => true,
        }),
        remove: jest.fn(async () => {}),
      },
      os: {
        homedir: () => homedir,
      },
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any)._pluginDir = "plugin-dir";
    (pluginManager as any).validatePlugin = () => ({ packageJson: packageJson1, isPluginValid: false });
    (pluginManager as any).extractMetadata = () => {};
    (pluginManager as any).skipPluginValidation = () => false;

    await pluginManager.loadFromPluginDir();
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(`Signature not verified for plugin: plugin-1`, this, LogLevel.warn, true));
    expect(nativeService.fs.remove).toHaveBeenCalledWith(path);
  });

  test("loadFromPluginDir, invalid plugin code", async () => {
    const pluginDir = "plugin-dir";
    const homedir = "homedir";
    const pluginDirContent = ["plugin-1"];
    const packageJson1 = {};
    const path = homedir + "/.Leapp/" + pluginDir + "/" + "plugin-1";
    const nativeService = {
      requireModule: () => {
        throw new Error("error");
      },
      hashElement: { hashElement: null },
      fs: {
        readdirSync: () => pluginDirContent,
        existsSync: (pluginFilePath) =>
          pluginFilePath === path || pluginFilePath === homedir + "/.Leapp/" + pluginDir + "/" + "plugin-1" + "/plugin.js",
        mkdirSync: () => {},
        lstatSync: () => ({
          isDirectory: () => true,
        }),
      },
      os: {
        homedir: () => homedir,
      },
      rimraf: jest.fn(),
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any)._pluginDir = "plugin-dir";
    (pluginManager as any).validatePlugin = () => ({ packageJson: packageJson1, isPluginValid: true });
    (pluginManager as any).extractMetadata = () => {};
    (pluginManager as any).skipPluginValidation = () => true;

    await pluginManager.loadFromPluginDir();
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(`error loading plugin plugin-1: error`, this, LogLevel.error, false));
  });

  test("unloadAllPlugins", () => {
    const plugin1 = {
      metadata: {
        uniqueName: "plugin-1",
        active: true,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.awsIamRoleChained, SessionType.aws],
      },
    };
    const plugin2 = {
      metadata: {
        uniqueName: "plugin-2",
        active: true,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.anytype],
      },
    };
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any)._pluginContainers = [plugin1, plugin2];
    pluginManager.unloadAllPlugins();
    expect((pluginManager as any)._pluginContainers).toStrictEqual([]);
  });

  test("unloadSinglePlugin", () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const plugin1 = {
      metadata: {
        uniqueName: "plugin-1",
        active: true,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.awsIamRoleChained, SessionType.aws],
      },
    };
    const plugin2 = {
      metadata: {
        uniqueName: "plugin-2",
        active: true,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.anytype],
      },
    };
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any)._pluginContainers = [plugin1, plugin2];
    pluginManager.unloadSinglePlugin("plugin-1");
    expect((pluginManager as any)._pluginContainers).toStrictEqual([plugin2]);
    pluginManager.unloadSinglePlugin("wrong-plugin");
    expect((pluginManager as any)._pluginContainers).toStrictEqual([plugin2]);
  });

  test("testRsaSignToBase64", () => {
    const nativeService = {
      crypto: {
        createSign: jest.fn(() => ({
          update: () => {},
          end: () => {},
          sign: () => "fake-signature",
        })),
      },
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    const result = pluginManager.testRsaSignToBase64("fake-message");
    expect(nativeService.crypto.createSign).toHaveBeenCalledWith("sha256");
    expect(result).toStrictEqual("fake-signature");
  });

  test("availableAwsCredentialsPlugins", () => {
    const sessionFactory = new SessionFactory(null, null, null, null, null);
    jest.spyOn(sessionFactory, "getCompatibleTypes");
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const repository = {
      getPluginStatus: () => ({ active: true }),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, repository, sessionFactory, null) as any;
    const plugin1 = {
      pluginType: AwsCredentialsPlugin.name,
      metadata: {
        uniqueName: "plugin-1",
        active: true,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.awsIamRoleChained, SessionType.aws],
      },
    };
    const plugin2 = {
      pluginType: AwsCredentialsPlugin.name,
      metadata: {
        uniqueName: "plugin-2",
        active: true,
        supportedOS: [OperatingSystem.windows],
        supportedSessions: [SessionType.awsIamRoleFederated, SessionType.awsIamUser],
      },
    };
    const plugin3 = {
      pluginType: AwsCredentialsPlugin.name,
      metadata: {
        uniqueName: "plugin-3",
        active: true,
        supportedOS: [OperatingSystem.linux],
        supportedSessions: [SessionType.awsIamRoleFederated],
      },
    };
    const plugin4 = {
      pluginType: AwsCredentialsPlugin.name,
      metadata: {
        uniqueName: "plugin-4",
        active: false,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.anytype],
      },
    };

    (pluginManager as any)._pluginContainers = [
      {
        metadata: {
          uniqueName: "plugin-1",
          active: true,
          supportedOS: [OperatingSystem.mac, OperatingSystem.linux, OperatingSystem.windows],
          supportedSessions: [SessionType.awsIamUser],
        },
        pluginInstances: [plugin1],
      },
      {
        metadata: {
          uniqueName: "plugin-2",
          active: true,
          supportedOS: [OperatingSystem.mac, OperatingSystem.linux, OperatingSystem.windows],
          supportedSessions: [SessionType.awsIamRoleFederated],
        },
        pluginInstances: [plugin2],
      },
      {
        metadata: {
          uniqueName: "plugin-3",
          active: true,
          supportedOS: [OperatingSystem.linux],
          supportedSessions: [SessionType.anytype],
        },
        pluginInstances: [plugin3],
      },
      {
        metadata: {
          uniqueName: "plugin-4",
          active: true,
          supportedOS: [OperatingSystem.linux],
          supportedSessions: [SessionType.aws],
        },
        pluginInstances: [plugin4],
      },
    ];
    const iamSession = {
      type: SessionType.awsIamUser,
    } as any;
    const federatedSession = {
      type: SessionType.awsIamRoleFederated,
    } as any;
    const azureSession = {
      type: SessionType.azure,
    } as any;
    const result1 = pluginManager.availableAwsCredentialsPlugins(OperatingSystem.mac, iamSession);
    expect(sessionFactory.getCompatibleTypes).toHaveBeenCalled();
    expect(result1).toStrictEqual([plugin1]);
    const result2 = pluginManager.availableAwsCredentialsPlugins(OperatingSystem.windows, federatedSession);
    expect(result2).toStrictEqual([plugin2]);
    const result3 = pluginManager.availableAwsCredentialsPlugins(OperatingSystem.linux, federatedSession);
    expect(result3).toStrictEqual([plugin2, plugin3, plugin4]);
    const result4 = pluginManager.availableAwsCredentialsPlugins(OperatingSystem.windows, azureSession);
    expect(result4).toStrictEqual([]);
  });

  test("installPlugin", async () => {
    const logService = {
      log: jest.fn(),
    } as any;
    const homedir = "homedir";
    const packageName = "leapp-fake-plugin";
    const tarballFilePath = "tarball-file-path";
    const fakePluginDir = "fake-plugin-dir";
    const tarballFileName = packageName + ".tgz";

    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
      os: {
        homedir: jest.fn(() => homedir),
      },
      path: {
        join: jest.fn((_, param2) => (param2 === packageName ? fakePluginDir : tarballFilePath)),
      },
      fs: {
        writeFileSync: jest.fn(),
        remove: jest.fn(),
        ensureDir: jest.fn(),
      },
      tar: {
        x: jest.fn(),
      },
    } as any;
    const npmMetadata = {
      ["dist-tags"]: {
        latest: "1.0.0",
      },
      versions: {
        ["1.0.0"]: {
          dist: {
            tarball: `https://fake-url/${packageName}.tgz`,
          },
        },
      },
      keywords: ["leapp-plugin"],
    };
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any).http = {
      get: jest.fn((param1, param2: any) => ({
        toPromise: async () => (param2.responseType === "json" ? npmMetadata : new ArrayBuffer(10)),
      })),
    };
    await pluginManager.installPlugin(`leapp://${packageName}`);
    expect(nativeService.os.homedir).toHaveBeenCalled();
    expect(logService.log).toHaveBeenNthCalledWith(
      1,
      new LoggedEntry(`We are ready to install Plugin ${packageName}, please wait...`, this, LogLevel.info, true)
    );
    expect((pluginManager as any).http.get).toHaveBeenNthCalledWith(1, `https://registry.npmjs.org/${packageName}`, { responseType: "json" });
    expect((pluginManager as any).http.get).toHaveBeenNthCalledWith(2, npmMetadata.versions[npmMetadata["dist-tags"].latest].dist.tarball, {
      responseType: "arraybuffer",
    });
    const pluginsDir = homedir + "/.Leapp/plugins";
    expect(nativeService.path.join).toHaveBeenNthCalledWith(1, pluginsDir, tarballFileName);
    expect(nativeService.fs.writeFileSync).toHaveBeenCalledWith(tarballFilePath, Buffer.from(new ArrayBuffer(10)));
    expect(nativeService.path.join).toHaveBeenNthCalledWith(2, pluginsDir, packageName);
    expect(nativeService.fs.remove).toHaveBeenNthCalledWith(1, fakePluginDir);
    expect(nativeService.fs.ensureDir).toHaveBeenCalledWith(fakePluginDir);
    expect(nativeService.tar.x).toHaveBeenCalledWith({ file: tarballFilePath, strip: 1, ["C"]: fakePluginDir });
    expect(nativeService.fs.remove).toHaveBeenNthCalledWith(2, tarballFilePath);
    expect(logService.log).toHaveBeenNthCalledWith(2, new LoggedEntry(`Plugin ${packageName} installed correctly.`, this, LogLevel.info, true));
  });

  test("installPlugin, no leapp-plugin keyword", async () => {
    const logService = {
      log: () => {},
    } as any;
    const homedir = "homedir";
    const packageName = "not-a-leapp-plugin";
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
      os: {
        homedir: () => homedir,
      },
    } as any;
    const npmMetadata = {
      name: packageName,
      ["dist-tags"]: {
        latest: "1.0.0",
      },
      versions: {
        ["1.0.0"]: {
          dist: {
            tarball: `https://fake-url/${packageName}.tgz`,
          },
        },
      },
      keywords: ["random-keyword"],
    };
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any).http = {
      get: jest.fn((param1, param2: any) => ({
        toPromise: async () => (param2.responseType === "json" ? npmMetadata : ""),
      })),
    };
    await expect(pluginManager.installPlugin(`leapp://${packageName}`)).rejects.toEqual(
      new LoggedException(`${npmMetadata["name"]} is not a Leapp plugin`, this, LogLevel.error, true)
    );
  });

  test("extractMetadata, success", () => {
    const sessionFactory = {
      getCompatibleTypes: jest.fn(() => ["any"]),
    } as any;
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const repository = {
      getPluginStatus: jest.fn(() => ({ active: true })),
    } as any;
    const packageJson = {
      version: "0.1.0",
      author: "author",
      name: "test-plugin",
      description: "test description",
      keywords: ["test-keyword", constants.npmRequiredPluginKeyword],
      leappPlugin: {
        supportedSessions: [SessionType.awsIamUser],
      },
    };
    const service = new PluginManagerService(null, nativeService, null, repository, sessionFactory, null) as any;
    const result = service.extractMetadata(packageJson);
    expect(sessionFactory.getCompatibleTypes).toHaveBeenCalledWith(SessionType.awsIamUser);
    expect(repository.getPluginStatus).toHaveBeenCalledWith(packageJson.name);
    expect(result).toStrictEqual({
      version: packageJson.version,
      active: true,
      author: packageJson.author,
      description: packageJson.description,
      supportedOS: [OperatingSystem.mac, OperatingSystem.linux, OperatingSystem.windows],
      supportedSessions: [SessionType.awsIamUser],
      icon: "fas fa-puzzle-piece",
      keywords: packageJson.keywords,
      uniqueName: packageJson.name,
      url: undefined,
    });
  });

  test("validatePlugin, not hash children", async () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: () => ({}) },
      fs: {
        existsSync: jest.fn(),
      },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    const result = await (pluginManager as any).validatePlugin(null, null, null);
    expect(result).toStrictEqual({ packageJson: undefined, isPluginValid: false });
  });

  /*
  test("validatePlugin, success and active plugin found", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const packageJsonContent = '{ "test": true }';
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: jest.fn(() => ({ children: true, hash: "fake-hash" })) },
      fs: {
        existsSync: jest.fn(() => true),
        readFileSync: jest.fn(() => packageJsonContent),
      },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any).rsaVerifySignatureFromBase64 = jest.fn(() => true);
    (pluginManager as any).http = {
      get: jest.fn(() => ({
        toPromise: async () => ({ status: "active", signature: "fake-signature" }),
      })),
    };
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect(nativeService.hashElement.hashElement).toHaveBeenCalledWith(pluginFilePath, options);
    expect(nativeService.fs.existsSync).toHaveBeenNthCalledWith(1, pluginFilePath + "/package.json");
    expect(nativeService.fs.existsSync).toHaveBeenNthCalledWith(2, pluginFilePath + "/plugin.js");
    expect(nativeService.fs.readFileSync).toHaveBeenCalledWith(pluginFilePath + "/package.json");
    // expect((pluginManager as any).http.get).toHaveBeenCalledWith(constants.pluginPortalUrl + "/plugin-1", { responseType: "json" });
    expect((pluginManager as any).rsaVerifySignatureFromBase64).toHaveBeenCalledWith(
      constants.publicKey,
      packageJsonContent + "fake-hash",
      "fake-signature"
    );
    expect(result).toStrictEqual({ packageJson: JSON.parse(packageJsonContent), isPluginValid: true });
  });
  */

  test("validatePlugin, verify signature correctly", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const packageJsonContent = '{ "test": true }';
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: () => ({ children: true, hash: "fake-hash" }) },
      fs: {
        existsSync: () => true,
        readFileSync: () => packageJsonContent,
      },
      rimraf: jest.fn(),
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any).http = {
      get: jest.fn(() => ({
        toPromise: async () => ({ status: "active", signature: "fake-signature" }),
      })),
    };
    (pluginManager as any).skipPluginValidation = () => false;
    (pluginManager as any).rsaVerifySignatureFromBase64 = jest.fn(() => true);
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect((pluginManager as any).rsaVerifySignatureFromBase64).toHaveBeenCalledWith(
      constants.publicKey,
      packageJsonContent + "fake-hash",
      "fake-signature"
    );
    expect(result).toStrictEqual({ packageJson: JSON.parse(packageJsonContent), isPluginValid: true });
  });

  test("validatePlugin, verify signature fails", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const packageJsonContent = '{ "test": true }';
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: () => ({ children: true, hash: "fake-hash" }) },
      fs: {
        existsSync: () => true,
        readFileSync: () => packageJsonContent,
      },
      rimraf: jest.fn(),
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any).http = {
      get: jest.fn(() => ({
        toPromise: async () => ({ status: "active", signature: "fake-signature" }),
      })),
    };
    (pluginManager as any).skipPluginValidation = () => false;
    (pluginManager as any).rsaVerifySignatureFromBase64 = jest.fn(() => false);
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect((pluginManager as any).rsaVerifySignatureFromBase64).toHaveBeenCalledWith(
      constants.publicKey,
      packageJsonContent + "fake-hash",
      "fake-signature"
    );
    expect(result).toStrictEqual({ packageJson: JSON.parse(packageJsonContent), isPluginValid: false });
  });

  test("validatePlugin, no active plugin found", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const packageJsonContent = '{ "test": true }';
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: () => ({ children: true }) },
      fs: {
        existsSync: () => true,
        readFileSync: () => packageJsonContent,
      },
      rimraf: jest.fn(),
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    (pluginManager as any).http = {
      get: jest.fn(() => ({
        toPromise: async () => ({ status: "inactive", signature: "fake-signature" }),
      })),
    };
    (pluginManager as any).skipPluginValidation = jest.fn(() => false);
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect((pluginManager as any).skipPluginValidation).toHaveBeenCalled();
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry("Plugin not in active state: " + "plugin-1", this, LogLevel.warn, true));
    expect(result).toStrictEqual({ packageJson: JSON.parse(packageJsonContent), isPluginValid: false });
  });

  test("validatePlugin, not a plugin folder", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: () => ({ children: true }) },
      fs: {
        existsSync: () => false,
      },
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect(logService.log).toHaveBeenCalledWith(
      new LoggedEntry(`folder ${pluginFilePath} is not a plugin folder, ignoring...`, this, LogLevel.info, false)
    );
    expect(result).toStrictEqual({ packageJson: undefined, isPluginValid: false });
  });

  test("validatePlugin, signature not verified", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const packageJsonContent = '{ "test": true }';
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: () => ({ children: true, hash: "fake-hash" }) },
      fs: {
        existsSync: () => true,
        readFileSync: () => packageJsonContent,
      },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    (pluginManager as any).rsaVerifySignatureFromBase64 = jest.fn(() => false);
    (pluginManager as any).http = {
      get: jest.fn(() => ({
        toPromise: async () => ({ status: "active", signature: "fake-signature" }),
      })),
    };
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect(result).toStrictEqual({ packageJson: JSON.parse(packageJsonContent), isPluginValid: true });
  });

  test("validatePlugin, hashing or verification failed", async () => {
    const pluginFilePath = "fake-filepath";
    const options = "fake-options";
    const error = "error";
    const nativeService = {
      hashElement: {
        hashElement: () => {
          throw new Error(error);
        },
      },
      requireModule: null,
    } as any;
    const logService = {
      log: jest.fn(),
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, logService, null, null, null);
    const result = await (pluginManager as any).validatePlugin(pluginFilePath, options, "plugin-1");
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(`hashing failed or verification failed: ${error}`, this, LogLevel.warn, false));
    expect(result).toStrictEqual({ packageJson: undefined, isPluginValid: false });
  });

  test("extractMetadata, throws an error about missing package.json entries", () => {
    const sessionFactory = {
      getCompatibleTypes: () => ["any"],
    } as any;
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const service = new PluginManagerService(null, nativeService, null, null, sessionFactory, null) as any;

    const packageJson1 = {};
    let expectedMissingValues = ["version", "name", "author", "description", "keywords", "leappPlugin"];
    expect(() => service.extractMetadata(packageJson1)).toThrowError(expectedMissingValues.join(", "));

    const packageJson2 = {
      version: "0.1.0",
      name: "test",
      description: "test description",
      leappPlugin: {},
    };
    expectedMissingValues = ["author", "keywords"];
    expect(() => service.extractMetadata(packageJson2)).toThrowError(expectedMissingValues.join(", "));

    packageJson2["keywords"] = ["test-keyword"];
    packageJson2["author"] = "author";
    expect(() => service.extractMetadata(packageJson2)).toThrowError(constants.npmRequiredPluginKeyword);
  });

  test("extractMetadata, throws an error about wrong/unspported session or operanting system", () => {
    const sessionFactory = {
      getCompatibleTypes: () => [],
    } as any;
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const packageJson = {
      version: "0.1.0",
      author: "author",
      name: "test",
      description: "test description",
      keywords: ["test-keyword", constants.npmRequiredPluginKeyword],
      leappPlugin: {
        entryClass: "test",
        supportedSessions: ["wrong-session"],
        supportedOS: [OperatingSystem.mac, "wrong-os"],
      },
    };
    const expectedErrors = ["leappPlugin.supportedSessions: wrong-session is unsupported", "leappPlugin.supportedOS: wrong-os is unsupported"];
    const service = new PluginManagerService(null, nativeService, null, null, sessionFactory, null) as any;
    expect(() => service.extractMetadata(packageJson)).toThrowError(expectedErrors.join(", "));
  });

  test("rsaVerifySignatureFromBase64", () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
      crypto: {
        createVerify: jest.fn(() => ({
          update: () => {},
          end: () => {},
          verify: () => true,
        })),
      },
    } as any;
    (PluginManagerService as any).base64Decoding = jest.fn(() => "fake-signature");
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    const result = (pluginManager as any).rsaVerifySignatureFromBase64();
    expect(result).toBeTruthy();
    expect(nativeService.crypto.createVerify).toHaveBeenCalledWith("sha256");
  });

  test("skipPluginValidation", () => {
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const pluginManager = new PluginManagerService(null, nativeService, null, null, null, null);
    const result = (pluginManager as any).skipPluginValidation();
    expect(result).toBeTruthy();
  });
});
