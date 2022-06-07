import { IMsalPersistence } from "../interfaces/i-msal-persistence";
import { JsonCache } from "@azure/msal-node";
import path from "path";
import { INativeService } from "../interfaces/i-native-service";

export class MsalPersistenceService implements IMsalPersistence {
  constructor(private iNativeService: INativeService) {}

  load(customPath?: string): Promise<JsonCache> {
    const location = customPath || path.join(this.iNativeService.os.homedir(), ".azure/msal_token_cache.json");
    try {
      const data = this.iNativeService.fs.readFileSync(location, "utf8");
      const parsedData = JSON.parse(data);
      return Promise.resolve(parsedData as JsonCache);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  save(cache: JsonCache, customPath?: string): Promise<void> {
    const data = JSON.stringify(cache, null, 4);
    const location = customPath || path.join(this.iNativeService.os.homedir(), ".azure/msal_token_cache.json");
    try {
      this.iNativeService.fs.writeFileSync(location, data, { encoding: "utf8" });
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
