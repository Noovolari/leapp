import { Injectable } from '@angular/core';
import { NativeService } from './native-service';

@Injectable({ providedIn: 'root' })
export class KeychainService extends NativeService {

  // Save secret
  saveSecret(service: string, account: string, password: string) {
    return this.keytar.setPassword(service, account, password);
  }

  // Retrieve the secret
  getSecret(service: string, account: string): any {
    return this.keytar.getPassword(service, account);
  }

  // Delete the secret
  deletePassword(service: string, account: string) {
    return this.keytar.deletePassword(service, account);
  }
}
