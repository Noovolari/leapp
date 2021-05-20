import {SessionType} from './session-type';
import {Account} from './account';

export class AwsFederatedAccount extends Account {
  accountId: string;
  accountName: string;
  accountNumber: string;
  role: { name: string; roleArn: string; parent?: string; parentRole?: string };
  idpArn?: string;
  idpUrl?: string;
  type: SessionType;
  parent?: string;
  parentRole?: string;
  region: string;
}
