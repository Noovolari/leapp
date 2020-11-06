import {Account} from './account';

export interface Session {
  id: string;
  lastStopDate: string;
  active: boolean;
  loading: boolean;
  account: Account;
}
