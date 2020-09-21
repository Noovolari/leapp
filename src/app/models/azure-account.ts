import {AccountType} from './AccountType';

export interface AzureAccount extends Account {
  accountId: string;
  accountName: string;
  subscriptionId: string;
  tenantId: string;
  type: AccountType;
}
