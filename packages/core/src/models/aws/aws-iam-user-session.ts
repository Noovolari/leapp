import { SessionType } from "../session-type";
import { Session } from "../session";

export class AwsIamUserSession extends Session {
  mfaDevice?: string;
  profileId: string;
  awsAccount?: { accountName: string; accountId: string };

  constructor(sessionName: string, region: string, profileId: string, mfaDevice?: string, awsAccount?: { accountName: string; accountId: string }) {
    super(sessionName, region);

    this.mfaDevice = mfaDevice;
    this.type = SessionType.awsIamUser;
    this.profileId = profileId;

    this.awsAccount = awsAccount;
  }
}
