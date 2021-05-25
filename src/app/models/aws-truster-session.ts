import {SessionType} from './session-type';
import {Session} from './session';

export class AwsTrusterSession extends Session {
  accountName: string;
  region: string;
  roleArn: string;
  type: SessionType;
  profileId: string;
  parentSessionId: string;

  constructor(accountName: string, region: string, roleArn: string, profileId: string, parentSessionId: string) {
    super(accountName, region);

    this.roleArn = roleArn;
    this.profileId = profileId;
    this.parentSessionId = parentSessionId;
    this.type = SessionType.awsTruster;
  }
}
