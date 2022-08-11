import { SessionType } from "../session-type";
import { Session } from "../session";

export class AwsIamUserSession extends Session {
  mfaDevice?: string;
  profileId: string;

  constructor(sessionName: string, region: string, profileId: string, mfaDevice?: string) {
    super(sessionName, region);

    this.mfaDevice = mfaDevice;
    this.type = SessionType.awsIamUser;
    this.profileId = profileId;
  }
}
