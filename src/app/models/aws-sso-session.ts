import {SessionType} from './session-type';
import {Session} from './session';

export class AwsSsoSession extends Session {

  email?: string;
  roleArn: string;
  profileId: string;

  constructor(sessionName: string, region: string, roleArn: string, profileId: string, email?: string) {
    super(sessionName, region);

    this.roleArn = roleArn;
    this.email= email;
    this.type = SessionType.awsSso;
    this.profileId = profileId;
  }
}
