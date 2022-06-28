import { SessionType } from "../session-type";
import { Session } from "../session";

export class AwsSsoRoleSession extends Session {
  email?: string;
  roleArn: string;
  profileId: string;
  awsSsoConfigurationId: string;

  constructor(sessionName: string, region: string, roleArn: string, profileId: string, awsSsoConfigurationId: string, email?: string) {
    super(sessionName, region);

    this.email = email;
    this.roleArn = roleArn;
    this.profileId = profileId;
    this.type = SessionType.awsSsoRole;
    this.awsSsoConfigurationId = awsSsoConfigurationId;
  }
}
