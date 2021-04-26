import {AccountType} from './AccountType';
import {Account} from './account';

export class AwsPlainAccount extends Account {
  accountId: number;
  accountName: string;
  accountNumber: string;
  region: string;
  user: string;
  mfaDevice?: string;
  type: AccountType;
}
