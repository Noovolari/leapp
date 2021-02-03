import {AccountType} from './AccountType';

export interface Account {
  accountName: string;
  type: AccountType;
  region: string;
}
