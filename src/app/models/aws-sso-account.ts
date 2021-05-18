import {SessionType} from './session-type';
import {Account} from './account';

export class AwsSsoAccount  extends Account {
  accountName: string;
  type: SessionType;
  region: string;
  accountId: string;
  accountNumber: string;
  email?: string;
  role: { name: string};
}
