import {Injectable} from '@angular/core';
import {ElectronService} from './electron.service';

@Injectable({ providedIn: 'root' })
export class KeychainService {

  constructor(private electronService: ElectronService) {}

  /**
   * Save your secret in the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @param password - secret
   */
  saveSecret(service: string, account: string, password: string) {
    return this.electronService.keytar.setPassword(service, account, password);
  }

  /**
   * Retrieve a Secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   * @returns the secret
   */
  getSecret(service: string, account: string): any {
    return this.electronService.keytar.getPassword(service, account);
  }

  /**
   * Delete a secret from the keychain
   *
   * @param service - environment.appName
   * @param account - unique identifier
   */
  deletePassword(service: string, account: string) {
    return this.electronService.keytar.deletePassword(service, account);
  }
}
