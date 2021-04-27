import {Injectable} from '@angular/core';
import {AccessStrategy} from './access-strategy';
import {CredentialsInfo} from '../models/credentials-info';
import {AccountType} from '../models/AccountType';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {Account} from '../models/account';

@Injectable({
  providedIn: 'root'
})
export class AwsPlainService implements AccessStrategy {

  constructor() { }

  applyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  createAccount(accountName: string, type: AccountType, region: string, accountInfo: { [p: string]: any }): Account {
    return new AwsPlainAccount(accountName, type, region, accountInfo.accessKey, accountInfo.secretKey, accountInfo.profileId, accountInfo.mfaDevice);
  }

  deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  generateCredentials(sessionId: string): CredentialsInfo {
    return undefined;
  }
}
