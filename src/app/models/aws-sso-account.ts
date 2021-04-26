import {AccountType} from './AccountType';
import {Account} from './account';

export class AwsSsoAccount  extends Account {
  accountName: string;
  type: AccountType;
  region: string;
  accountId: string;
  accountNumber: string;
  email?: string;
  role: { name: string};
}
