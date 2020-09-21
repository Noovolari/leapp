import {AccountType} from './AccountType';

export interface AwsAccount extends Account {
  accountId: number;
  accountName: string;
  accountNumber: string;
  role: { name: string, roleArn: string, parent?: string, parentRole?: string };
  idpArn?: string;
  idpUrl?: string;
  type: AccountType;
  parent?: string;
  parentRole?: string;
}
