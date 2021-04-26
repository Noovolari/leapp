import {AccountType} from './AccountType';
import {Account} from './account';

export class AwsAccount extends Account {
  accountId: string;
  accountName: string;
  accountNumber: string;
  role: { name: string, roleArn: string, parent?: string, parentRole?: string };
  idpArn?: string;
  idpUrl?: string;
  type: AccountType;
  parent?: string;
  parentRole?: string;
  region: string;
}
