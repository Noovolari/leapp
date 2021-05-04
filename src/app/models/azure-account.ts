import {AccountType} from './AccountType';
import {Account} from './account';

export class AzureAccount extends Account {
  accountName: string;
  subscriptionId: string;
  tenantId: string;
  type: AccountType;
  region: string;
}
