import { SessionType } from "../session-type";
import { Session } from "../session";

export class AwsConsoleLoginSession extends Session {
  email?: string;
  profileId: string;

  constructor(sessionName: string, region: string, profileId: string, email?: string) {
    super(sessionName, region);

    this.email = email;
    this.profileId = profileId;
    this.type = SessionType.awsConsoleLogin;
  }
}
