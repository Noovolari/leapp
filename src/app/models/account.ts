import {AccountType} from './AccountType';
import * as uuid from 'uuid';

export class Account {
  accountName: string;
  type: AccountType;
  region: string;
  accountId: string;

  constructor(accountName: string, type: AccountType, region: string) {
    this.accountName = accountName;
    this.type = type;
    this.region = region;
    this.accountId = uuid.v4();
  }
}
