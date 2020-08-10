export interface AccountData {
  accountName: string;
  accountNumber: string;
}

export interface RoleData {
  name: string;
}

export interface SessionObject {
  color: string;
  active: boolean;
  roleData: RoleData;
  accountData: AccountData;
}
