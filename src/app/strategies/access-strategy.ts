import {Account} from '../models/account';
import {AccountType} from '../models/AccountType';
import {CredentialsInfo} from '../models/credentials-info';

export interface AccessStrategy {

  createAccount(  accountName: string, type: AccountType, region: string, accountInfo: { [key: string]: any }): Account;

  generateCredentials(sessionId: string): CredentialsInfo;
  applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
}
