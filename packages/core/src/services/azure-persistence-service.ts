import { JsonCache } from "@azure/msal-node";
import { INativeService } from "../interfaces/i-native-service";

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
  currentUser = "CurrentUser",
  localMachine = "LocalMachine",
}

export class AzurePersistenceService {
  constructor(private iNativeService: INativeService) {}

  async loadMsalCache(customPath?: string): Promise<JsonCache> {
    const isWin = this.iNativeService.process.platform === "win32";
    const msalTokenCacheFileExtension = isWin ? ".bin" : ".json";
    const location =
      customPath || this.iNativeService.path.join(this.iNativeService.os.homedir(), `.azure/msal_token_cache${msalTokenCacheFileExtension}`);
    const data = this.iNativeService.fs.readFileSync(location);
    const finalData = isWin
      ? this.iNativeService.msalEncryptionService.unprotectData(data, null, DataProtectionScope.currentUser).toString()
      : data.toString();
    const parsedData = JSON.parse(finalData.trim());
    return Promise.resolve(parsedData as JsonCache);
  }

  async saveMsalCache(cache: JsonCache, customPath?: string): Promise<void> {
    const data = JSON.stringify(cache, null, 4);
    const isWin = this.iNativeService.process.platform === "win32";
    const msalTokenCacheFileExtension = isWin ? ".bin" : ".json";
    const location =
      customPath || this.iNativeService.path.join(this.iNativeService.os.homedir(), `.azure/msal_token_cache${msalTokenCacheFileExtension}`);
    const finalData = isWin
      ? this.iNativeService.msalEncryptionService.protectData(Buffer.from(data, "utf-8"), null, DataProtectionScope.currentUser)
      : data;
    this.iNativeService.fs.writeFileSync(location, finalData);
  }

  async loadProfile(): Promise<AzureProfile> {
    const location = this.iNativeService.path.join(this.iNativeService.os.homedir(), ".azure/azureProfile.json");
    const data = this.iNativeService.fs.readFileSync(location, "utf8");
    const parsedData = JSON.parse(data.trim());
    return Promise.resolve(parsedData as AzureProfile);
  }
}
