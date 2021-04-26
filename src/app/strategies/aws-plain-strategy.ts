import {AccessStrategy} from './access-strategy';
import {CredentialsInfo} from '../models/credentials-info';
import {AccountType} from '../models/AccountType';
import {Account} from '../models/account';


export class AwsPlainStrategy implements AccessStrategy {

  applyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  generateCredentials(sessionId: string): CredentialsInfo {
    return undefined;
  }

  createAccount(accountName: string, type: AccountType, region: string, accountInfo: object): Account {
    return new Account(accountName, type, region);
  }
}
