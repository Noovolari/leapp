import {AccountType} from './AccountType';

export class Account {
  accountName: string;
  type: AccountType;
  region: string;

  constructor(accountName: string, region: string) {
    this.accountName = accountName;
    this.region = region;
  }
}
