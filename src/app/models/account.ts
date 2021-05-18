import {SessionType} from './session-type';

export class Account {
  accountName: string;
  type: SessionType;
  region: string;

  constructor(accountName: string, region: string) {
    this.accountName = accountName;
    this.region = region;
  }
}
