import {Account} from './account';
import * as uuid from 'uuid';

export class Session {
  sessionId: string;
  profileId: string;
  startDateTime: string;
  lastStopDateTime: string;
  active: boolean;
  loading: boolean;
  account: Account;

  constructor(account: Account, profileId: string) {
    this.sessionId = uuid.v4();
    this.profileId = profileId;
    this.startDateTime = new Date().toISOString();
    this.lastStopDateTime = undefined;
    this.active = false;
    this.loading = false;
    this.account = account;
  }
}
