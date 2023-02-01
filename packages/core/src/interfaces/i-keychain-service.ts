export interface IKeychainService {
  /**
   * Save your secret in the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @param password - secret
   */
  saveSecret(service: string, account: string, password: string): Promise<void>;

  /**
   * Retrieve a Secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @returns the secret
   */
  getSecret(service: string, account: string): Promise<string | null>;

  /**
   * Delete a secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   */
  deleteSecret(service: string, account: string): Promise<boolean>;
}
