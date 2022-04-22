import { INativeService } from "../interfaces/i-native-service";

export class KeychainService {
  constructor(private nativeService: INativeService) {}

  /**
   * Save your secret in the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @param password - secret
   */
  async saveSecret(service: string, account: string, password: string): Promise<void> {
    return await this.nativeService.keytar.setPassword(service, account, password);
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
  async deletePassword(service: string, account: string): Promise<boolean> {
    return await this.nativeService.keytar.deletePassword(service, account);
  }
}
