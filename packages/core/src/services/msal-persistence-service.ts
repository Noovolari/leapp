import { IMsalPersistence } from "../interfaces/i-msal-persistence";
import { JsonCache } from "@azure/msal-node";
import path from "path";
import { INativeService } from "../interfaces/i-native-service";
import { IMsalEncryptionService } from "../interfaces/i-msal-encryption-service";

export interface AzureSubscription {
  id: string;
  name: string;
  state: string;
  user: { name: string; type: string };
  isDefault: boolean;
  tenantId: string;
  environmentName: string;
  homeTenantId: string;
  managedByTenants: any[];
}

export interface AzureProfile {
  subscriptions: AzureSubscription[];
}

export enum DataProtectionScope {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CurrentUser = "CurrentUser",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LocalMachine = "LocalMachine",
}

export class MsalPersistenceService implements IMsalPersistence {
  constructor(private iNativeService: INativeService, private iMsalEncryptionService: IMsalEncryptionService) {}

  load(customPath?: string): Promise<JsonCache> {
    const msalTokenCacheFileExtension = this.iNativeService.process.platform === "win32" ? ".bin" : ".json";
    const location = customPath || path.join(this.iNativeService.os.homedir(), `.azure/msal_token_cache${msalTokenCacheFileExtension}`);
    try {
      const data = this.iNativeService.fs.readFileSync(location, "utf8");
      const finalData = this.iMsalEncryptionService.unprotectData(data, null, DataProtectionScope.toString()).toString();
      const parsedData = JSON.parse(finalData.trim());
      return Promise.resolve(parsedData as JsonCache);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  save(cache: JsonCache, customPath?: string): Promise<void> {
    const data = JSON.stringify(cache, null, 4);
    const msalTokenCacheFileExtension = this.iNativeService.process.platform === "win32" ? ".bin" : ".json";
    const location = customPath || path.join(this.iNativeService.os.homedir(), `.azure/msal_token_cache${msalTokenCacheFileExtension}`);
    const isWin = this.iNativeService.process.platform === "win32";
    const finalData = isWin ? this.iMsalEncryptionService.protectData(Buffer.from(data, "utf-8"), null, DataProtectionScope.toString()) : data;

    try {
      this.iNativeService.fs.writeFileSync(location, finalData, { encoding: "utf8" });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  loadAzureProfile(customPath?: string): Promise<AzureProfile> {
    const location = customPath || path.join(this.iNativeService.os.homedir(), ".azure/azureProfile.json");
    try {
      const data = this.iNativeService.fs.readFileSync(location, "utf8");
      console.log(data);
      const parsedData = JSON.parse(data.trim());
      return Promise.resolve(parsedData as AzureProfile);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
