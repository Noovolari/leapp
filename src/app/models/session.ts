import {Account} from './account';

export interface Session {
  id: string;
  profile: string;
  lastStopDate: string;
  active: boolean;
  loading: boolean;
  complete: boolean;
  account: Account;
}
