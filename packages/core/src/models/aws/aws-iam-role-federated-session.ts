import { SessionType } from "../session-type";
import { Session } from "../session";

export class AwsIamRoleFederatedSession extends Session {
  idpUrlId: string;
  idpArn: string;
  roleArn: string;
  profileId: string;
  awsAccount?: { accountName: string; accountId: string };

  constructor(
    sessionName: string,
    region: string,
    idpUrlId: string,
    idpArn: string,
    roleArn: string,
    profileId: string,
    awsAccount?: { accountName: string; accountId: string }
  ) {
    super(sessionName, region);

    this.idpUrlId = idpUrlId;
    this.idpArn = idpArn;
    this.roleArn = roleArn;
    this.profileId = profileId;
    this.type = SessionType.awsIamRoleFederated;

    this.awsAccount = awsAccount;
  }
}
