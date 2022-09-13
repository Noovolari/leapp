import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamUserSessionRequest } from "../../services/session/aws/aws-iam-user-session-request";

export class AwsIamUserSessionData extends SessionData {
  /**
   * The profileId field refer to an internal ID rather than the name assigned by the user
   * When instanciating this class, use the method getProfileIdByName() to obtain the ID from the name of the profile
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
