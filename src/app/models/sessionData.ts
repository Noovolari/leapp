export interface AccountData {
  accountName: string;
  accountNumber: string;
}

export interface RoleData {
  name: string;
}
// TODO: showTray is not needed.
export interface SessionObject {
  color: string;
  active: boolean;
  showTray: boolean;
  roleData: RoleData;
  accountData: AccountData;
}
