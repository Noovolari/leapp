import {AccountType} from './AccountType';
import {Account} from './account';

export class AwsPlainAccount extends Account {
  accountName: string;

  region: string;
  mfaDevice?: string;
  type: AccountType;

  constructor(accountName: string, region: string, mfaDevice?: string) {
    super(accountName, region);
    this.mfaDevice = mfaDevice;
    this.type = AccountType.AWS_PLAIN_USER;
  }

}

