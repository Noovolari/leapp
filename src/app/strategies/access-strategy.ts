import {Account} from '../models/account';
import {AccountType} from '../models/AccountType';
import {CredentialsInfo} from '../models/credentials-info';

export interface AccessStrategy {
  generateCredentials(sessionId: string): CredentialsInfo;
  applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;

  createAccount(  accountName: string, type: AccountType, region: string, accountInfo: { [key: string]: any }): Account;
}
