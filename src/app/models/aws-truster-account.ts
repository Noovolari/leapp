import {SessionType} from './session-type';
import {Account} from './account';

export class AwsTrusterAccount extends Account {
  accountName: string;
  region: string;
  roleArn: string;
  type: SessionType;
  profileId: string;

  constructor(accountName: string, region: string, roleArn: string, profileId: string) {
    super(accountName, region);
    this.roleArn = roleArn;
    this.profileId = profileId;
    this.type = SessionType.awsTruster;
  }
}
