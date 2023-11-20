import { INativeService } from "../interfaces/i-native-service";
import { IKeychainService } from "../interfaces/i-keychain-service";

export class KeychainService implements IKeychainService {
  constructor(private nativeService: INativeService) {}

  /**
   * Save your secret in the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @param password - secret - not null
   */
  async saveSecret(service: string, account: string, password: string): Promise<void> {
    return await this.nativeService.keytar.setPassword(service, account, password ?? "<EMPTY>");
  }

  /**
   * Retrieve a Secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @returns the secret
   */
  async getSecret(service: string, account: string): Promise<string | null> {
    return await this.nativeService.keytar.getPassword(service, account);
  }

  /**
   * Delete a secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   */
  async deleteSecret(service: string, account: string): Promise<boolean> {
    return await this.nativeService.keytar.deleteSecret(service, account);
  }
}
