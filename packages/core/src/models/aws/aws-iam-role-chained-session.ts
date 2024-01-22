import { SessionType } from "../session-type";
import { Session } from "../session";

export class AwsIamRoleChainedSession extends Session {
  roleArn: string;
  profileId: string;
  parentSessionId: string;
  roleSessionName?: string;
  awsAccount?: { accountName: string; accountId: string };

  constructor(
    sessionName: string,
    region: string,
    roleArn: string,
    profileId: string,
    parentSessionId: string,
    roleSessionName?: string,
    awsAccount?: { accountName: string; accountId: string }
  ) {
    super(sessionName, region);

    this.roleArn = roleArn;
    this.profileId = profileId;
    this.parentSessionId = parentSessionId;
    this.type = SessionType.awsIamRoleChained;
    this.roleSessionName = roleSessionName ? roleSessionName : `assumed-from-leapp`;

    this.awsAccount = awsAccount;
  }
}
