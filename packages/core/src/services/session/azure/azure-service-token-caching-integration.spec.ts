import { describe, test } from "@jest/globals";
import { NodeStorage } from "@azure/msal-node";
import { FilePersistence } from "@azure/msal-node-extensions";
import { homedir } from "os";
import * as path from "path";

describe("AzureService Integration", () => {
  test("cacheToken", async () => {
    const cacheFilePersistence = await FilePersistence.create(path.join(homedir(), ".azure/msal_token_cache.json"));
    const cacheFile = await cacheFilePersistence.load();
    const memoryCache = NodeStorage.generateInMemoryCache(cacheFile);
    console.log(memoryCache.refreshTokens);
  });
});
