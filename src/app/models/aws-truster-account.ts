import {SessionType} from './session-type';
import {Account} from './account';

export class AwsTrusterAccount extends Account {
  accountName: string;
  region: string;
  roleArn: string;
  type: SessionType;

  constructor(accountName: string, region: string, roleArn?: string) {
    super(accountName, region);
    this.roleArn = roleArn;
    this.type = SessionType.awsTruster;
  }
}
