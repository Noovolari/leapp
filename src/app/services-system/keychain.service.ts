import { Injectable } from '@angular/core';
import { NativeService } from './native-service';
import { Observable } from 'rxjs';
import {bool} from 'aws-sdk/clients/signer';

@Injectable({ providedIn: 'root' })
export class KeychainService extends NativeService {

  // Save secret
  saveSecret(service: string, account: string, password: string): boolean {
    return this.keytar.setPassword(service, account, password);
  }

  // Retrieve the secret
  getSecret(service: string, account: string): any {
    return this.keytar.getPassword(service, account);
  }

  // Delete the secret
  deletePassword(service: string, account: string): boolean {
    return this.keytar.deletePassword(service, account);
  }
}
