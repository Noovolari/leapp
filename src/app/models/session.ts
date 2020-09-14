import {AccountType} from './AccountType';
import {Account} from './account';

export interface Session {
  id: string;
  active: boolean;
  loading: boolean;
  account: Account;
}
