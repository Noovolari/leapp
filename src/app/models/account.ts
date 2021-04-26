import {AccountType} from './AccountType';

export class Account {
  accountName: string;
  type: AccountType;
  region: string;

  constructor(accountName: string, type: AccountType, region: string) {
    this.accountName = accountName;
    this.type = type;
    this.region = region;
  }
}
