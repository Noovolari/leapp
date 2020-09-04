export interface AccountData {
  accountName: string;
  accountNumber?: string;
  subscriptionId?: string;
}

export interface RoleData {
  name: string;
}

export interface SessionObject {
  color: string;
  active: boolean;
  loading: boolean;
  roleData: RoleData;
  accountData: AccountData;
}
