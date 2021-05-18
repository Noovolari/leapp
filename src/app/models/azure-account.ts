import {SessionType} from './session-type';
import {Account} from './account';

export class AzureAccount extends Account {
  accountName: string;
  subscriptionId: string;
  tenantId: string;
  type: SessionType;
  region: string;
}
