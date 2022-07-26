import { jest, describe, test, expect } from "@jest/globals";
import { PluginManagerService } from "./plugin-manager-service";

describe("PluginManagerService", () => {
  test("extractMetadata", () => {
    const sessionFactory = {
      getCompatibleTypes: jest.fn(),
    } as any;
    const nativeService = {
      requireModule: null,
      hashElement: { hashElement: null },
    } as any;
    const service = new PluginManagerService(nativeService, null, null, sessionFactory, null) as any;

    const packageJson = {};
    expect(() => service.extractMetadata(packageJson)).toThrowError("sfgdg");
  });
});
