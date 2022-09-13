import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamRoleChainedSessionRequest } from "../../services/session/aws/aws-iam-role-chained-session-request";

export class AwsIamRoleChainedSessionData extends SessionData {
  /**
   * The profileId field refer to an internal ID rather than the name assigned by the user
   * When instanciating this class, use the method getProfileIdByName() to obtain the ID from the name of the profile
   */
  constructor(public parentSessionId: string, public profileId: string, public region: string, public roleArn: string, public sessionName: string) {
    super(SessionType.awsIamRoleChained);
  }

  getCreationRequest(): AwsIamRoleChainedSessionRequest {
    return {
      parentSessionId: this.parentSessionId,
      profileId: this.profileId,
      region: this.region,
      roleArn: this.roleArn,
      sessionName: this.sessionName,
    };
  }
}
