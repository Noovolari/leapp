export interface AzureAccount extends Account {
  accountId: string;
  accountName: string;
  subscriptionId: string;
  idpUrl: string;
  type: string;
}
