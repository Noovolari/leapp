import {AccessStrategy} from './access-strategy';
import {CredentialsInfo} from '../models/credentials-info';
import {AccountType} from '../models/AccountType';
import {Account} from '../models/account';
import {AwsPlainAccount} from '../models/aws-plain-account';


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

  createAccount(accountName: string, type: AccountType, region: string, accountInfo: { [key: string]: any }): Account {
    return new AwsPlainAccount(accountName, type, region, accountInfo.accessKey, accountInfo.secretKey, accountInfo.profileId, accountInfo.mfaDevice);
  }
}
