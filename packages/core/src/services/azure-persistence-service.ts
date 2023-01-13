import { JsonCache, SerializedRefreshTokenEntity } from "@azure/msal-node";
import { INativeService } from "../interfaces/i-native-service";
import { constants } from "../models/constants";
import { SerializedAccountEntity } from "@azure/msal-node/dist/cache/serializer/SerializerTypes";
import { IKeychainService } from "../interfaces/i-keychain-service";

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
  installationId: string;
  subscriptions: AzureSubscription[];
}

export enum DataProtectionScope {
  currentUser = "CurrentUser",
  localMachine = "LocalMachine",
}

export interface AzureSecrets {
  profile: AzureProfile;
  account: [string, SerializedAccountEntity];
  refreshToken: [string, SerializedRefreshTokenEntity];
}

export class AzurePersistenceService {
  constructor(private iNativeService: INativeService, private keychainService: IKeychainService) {}

  async loadMsalCache(): Promise<JsonCache> {
    const isWin = this.iNativeService.process.platform === "win32";
    const location = this.getMsalCacheLocation(isWin);
    const data = this.iNativeService.fs.readFileSync(location);
    const finalData = isWin
      ? (await this.iNativeService.msalEncryptionService.unprotectData(data, null, DataProtectionScope.currentUser)).toString()
      : data.toString();
    return JSON.parse(finalData.trim());
  }

  async saveMsalCache(cache: JsonCache): Promise<void> {
    const data = JSON.stringify(cache, null, 4);
    const isWin = this.iNativeService.process.platform === "win32";
    const location = this.getMsalCacheLocation(isWin);
    const finalData = isWin
      ? await this.iNativeService.msalEncryptionService.protectData(Buffer.from(data, "utf-8"), null, DataProtectionScope.currentUser)
      : data;
    this.iNativeService.fs.writeFileSync(location, finalData);
  }

  async loadProfile(): Promise<AzureProfile> {
    const data = this.iNativeService.fs.readFileSync(this.getProfileLocation(), "utf8");
    return JSON.parse(data.trim());
  }

  async saveProfile(profile: AzureProfile): Promise<void> {
    this.iNativeService.fs.writeFileSync(this.getProfileLocation(), JSON.stringify(profile, null, 4));
  }

  async getAzureSecrets(integrationId: string): Promise<AzureSecrets> {
    return {
      profile: JSON.parse(await this.keychainService.getSecret(constants.appName, this.getProfileKeychainKey(integrationId))),
      account: JSON.parse(await this.keychainService.getSecret(constants.appName, this.getAccountKeychainKey(integrationId))),
      refreshToken: JSON.parse(await this.keychainService.getSecret(constants.appName, this.getRefreshTokenKeychainKey(integrationId))),
    };
  }

  async setAzureSecrets(integrationId: string, secrets: AzureSecrets): Promise<void> {
    await this.keychainService.saveSecret(constants.appName, this.getProfileKeychainKey(integrationId), JSON.stringify(secrets.profile));
    await this.keychainService.saveSecret(constants.appName, this.getAccountKeychainKey(integrationId), JSON.stringify(secrets.account));
    await this.keychainService.saveSecret(constants.appName, this.getRefreshTokenKeychainKey(integrationId), JSON.stringify(secrets.refreshToken));
  }

  async deleteAzureSecrets(integrationId: string): Promise<void> {
    try {
      await this.keychainService.deleteSecret(constants.appName, this.getProfileKeychainKey(integrationId));
    } catch (error) {}
    try {
      await this.keychainService.deleteSecret(constants.appName, this.getAccountKeychainKey(integrationId));
    } catch (error) {}
    try {
      await this.keychainService.deleteSecret(constants.appName, this.getRefreshTokenKeychainKey(integrationId));
    } catch (error) {}
  }

  private getMsalCacheLocation(isWin: boolean): string {
    const msalTokenCacheFileExtension = isWin ? ".bin" : ".json";
    return this.iNativeService.path.join(this.iNativeService.os.homedir(), `.azure/msal_token_cache${msalTokenCacheFileExtension}`);
  }

  private getProfileLocation(): string {
    return this.iNativeService.path.join(this.iNativeService.os.homedir(), ".azure/azureProfile.json");
  }

  private getAccountKeychainKey(integrationId: string): string {
    return `azure-integration-account-${integrationId}`;
  }

  private getRefreshTokenKeychainKey(integrationId: string): string {
    return `azure-integration-refresh-token-${integrationId}`;
  }

  private getProfileKeychainKey(integrationId: string): string {
    return `azure-integration-profile-${integrationId}`;
  }
}
