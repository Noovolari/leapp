import { describe, expect, jest, test } from "@jest/globals";
import { PluginManagerService } from "./plugin-manager-service";
import { constants } from "../models/constants";
import { OperatingSystem } from "../models/operating-system";
import { SessionType } from "../models/session-type";
import { SessionFactory } from "../services/session-factory";

describe("PluginManagerService", () => {
  test("availablePlugins", () => {
    const sessionFactory = new SessionFactory(null, null, null, null, null);
    jest.spyOn(sessionFactory, "getCompatibleTypes");
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const pluginManager = new PluginManagerService(nativeService, null, null, sessionFactory, null) as any;
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
        supportedOS: [OperatingSystem.windows],
        supportedSessions: [SessionType.awsIamRoleFederated, SessionType.awsIamUser],
      },
    };
    const plugin3 = {
      metadata: {
        uniqueName: "plugin-3",
        active: true,
        supportedOS: [OperatingSystem.linux],
        supportedSessions: [SessionType.awsIamRoleFederated],
      },
    };
    const plugin4 = {
      metadata: {
        uniqueName: "plugin-4",
        active: false,
        supportedOS: [OperatingSystem.mac, OperatingSystem.linux],
        supportedSessions: [SessionType.azure, SessionType.anytype],
      },
    };

    (pluginManager as any)._plugins = [plugin1, plugin2, plugin3, plugin4];
    const iamSession = {
      type: SessionType.awsIamUser,
    } as any;
    const federatedSession = {
      type: SessionType.awsIamRoleFederated,
    } as any;
    const azureSession = {
      type: SessionType.azure,
    } as any;
    const result1 = pluginManager.availablePlugins(OperatingSystem.mac, iamSession);
    expect(sessionFactory.getCompatibleTypes).toHaveBeenCalled();
    expect(result1).toStrictEqual([plugin1]);
    const result2 = pluginManager.availablePlugins(OperatingSystem.windows, federatedSession);
    expect(result2).toStrictEqual([plugin2]);
    const result3 = pluginManager.availablePlugins(OperatingSystem.linux, federatedSession);
    expect(result3).toStrictEqual([plugin1, plugin3]);
    const result4 = pluginManager.availablePlugins(OperatingSystem.windows, azureSession);
    expect(result4).toStrictEqual([]);
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
        entryClass: "test",
      },
    };
    const service = new PluginManagerService(nativeService, null, repository, sessionFactory, null) as any;
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
      entryClass: packageJson.leappPlugin.entryClass,
      keywords: packageJson.keywords,
      uniqueName: packageJson.name,
      url: undefined,
    });
  });

  test("extractMetadata, throws an error about missing package.json entries", () => {
    const sessionFactory = {
      getCompatibleTypes: () => ["any"],
    } as any;
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const service = new PluginManagerService(nativeService, null, null, sessionFactory, null) as any;

    const packageJson1 = {};
    let expectedMissingValues = ["version", "name", "author", "description", "keywords", "leappPlugin"];
    expect(() => service.extractMetadata(packageJson1)).toThrowError(expectedMissingValues.join(", "));

    const packageJson2 = {
      version: "0.1.0",
      name: "test",
      description: "test description",
      leappPlugin: {},
    };
    expectedMissingValues = expectedMissingValues.filter((value) => value === "keywords" || value === "author");
    expectedMissingValues.push("leappPlugin.entryClass");
    expect(() => service.extractMetadata(packageJson2)).toThrowError(expectedMissingValues.join(", "));

    packageJson2["keywords"] = ["test-keyword"];
    packageJson2["author"] = "author";
    packageJson2["leappPlugin"]["entryClass"] = "entryClass";
    expectedMissingValues = [constants.npmRequiredPluginKeyword];
    expect(() => service.extractMetadata(packageJson2)).toThrowError(expectedMissingValues[0]);
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
    const service = new PluginManagerService(nativeService, null, null, sessionFactory, null) as any;
    expect(() => service.extractMetadata(packageJson)).toThrowError(expectedErrors.join(", "));
  });
});
