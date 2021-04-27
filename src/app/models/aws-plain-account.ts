import {AccountType} from './AccountType';
import {Account} from './account';

export class AwsPlainAccount extends Account {
  accountId: string;
  accountName: string;
  accessKey: string;
  secretKey: string;
  region: string;
  mfaDevice?: string;
  profileId: string;
  type: AccountType;

  constructor(accountName: string, type: AccountType, region: string, accessKey: string, secretKey: string, profileId: string, mfaDevice?: string) {
    super(accountName, type, region );
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.mfaDevice = mfaDevice;
    this.profileId = profileId;
  }

}

