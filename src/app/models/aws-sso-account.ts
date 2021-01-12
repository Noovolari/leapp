import {AccountType} from './AccountType';
import {Account} from './account';

export interface AwsSsoAccount  extends Account {
  accountName: string;
  type: AccountType;
  accountId: string;
  accountNumber: string;
  email?: string;
  role: { name: string};
}
