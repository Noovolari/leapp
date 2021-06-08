import {SessionType} from './session-type';
import {Session} from './session';

export class AwsSsoSession extends Session {

  email?: string;
  roleArn: string;
  profileId: string;

  constructor(sessionName: string, region: string, roleArn: string, profileId: string, email?: string) {
    super(sessionName, region);

    this.email= email;
    this.roleArn = roleArn;
    this.profileId = profileId;
    this.type = SessionType.awsSso;
  }
}
