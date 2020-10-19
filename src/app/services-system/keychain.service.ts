import {Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {AppService, LoggerLevel} from './app.service';

@Injectable({ providedIn: 'root' })
export class KeychainService extends NativeService {

  constructor(private appService: AppService) {
    super();
  }

  /**
   * Save your secret in the keychain
   * @param service - environment.appName
   * @param account - unique identifier
   * @param password - secret
   */
  saveSecret(service: string, account: string, password: string): boolean {
    return this.keytar.setPassword(service, account, password);
  }

  /**
   * Retrieve a Secret from the keychain
   * @param service - environment.appName
   * @param account - unique identifier
   * @returns the secret
   */
  getSecret(service: string, account: string): any {
    return this.keytar.getPassword(service, account);
  }

  /**
   * Delete a secret from the keychain
   * @param service - environment.appName
   * @param account - unique identifier
   */
  deletePassword(service: string, account: string): boolean {
    return this.keytar.deletePassword(service, account);
  }
}
