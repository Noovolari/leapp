import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamUserSessionRequest } from "../../services/session/aws/aws-iam-user-session-request";

export class AwsIamUserSessionData extends SessionData {
  /**
   * @param profileId - ID of the Named Profile that is going to be associated with the Leapp Session; it refers to an internal ID rather than the name assigned by the user.
   * When instantiating this class, use the method getProfileIdByName() to obtain the Named Profile ID by passing its name.
   * @param region - the region that is going to be associated with the Leapp Session
   * @param sessionName - the name of the Leapp Session
   * @param accessKey - the Access Key ID associated with the IAM User. See {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html|AWS documentation}.
   * @param secretKey - the Secret Access Key associated with the IAM User. See {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html|AWS documentation}.
   */
  constructor(public profileId: string, public region: string, public sessionName: string, public accessKey?: string, public secretKey?: string) {
    super(SessionType.awsIamUser);
  }

  getCreationRequest(): AwsIamUserSessionRequest {
    return {
      profileId: this.profileId,
      region: this.region,
      sessionName: this.sessionName,
      accessKey: this.accessKey,
      secretKey: this.secretKey,
    };
  }
}
