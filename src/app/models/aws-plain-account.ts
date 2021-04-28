import {AccountType} from './AccountType';
import {Account} from './account';

export class AwsPlainAccount extends Account {
  accountName: string;
  accessKey: string;
  secretKey: string;
  region: string;
  mfaDevice?: string;
  type: AccountType;

  constructor(accountName: string, region: string, accessKey: string, secretKey: string, mfaDevice?: string) {
    super(accountName, region);
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.mfaDevice = mfaDevice;
    this.type = AccountType.AWS_PLAIN_USER;
  }

}

