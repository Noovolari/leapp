import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamRoleChainedSessionRequest } from "../../services/session/aws/aws-iam-role-chained-session-request";

export class AwsIamRoleChainedSessionData extends SessionData {
  /**
   * @param parentSessionId - the ID of the parent Leapp Session this Leapp Session is going to be assumed from.
   * @param profileId - ID of the Named Profile that is going to be associated with the Leapp Session; it refers to an internal ID rather than the name assigned by the user.
   * When instantiating this class, use the method getProfileIdByName() to obtain the Named Profile ID by passing its name.
   * @param region - the region associated with the Leapp Session
   * @param roleArn - the ARN of the Role that has to be assumed via {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_terms-and-concepts.html|Role Chaining}
   * @param sessionName - the name of the Leapp Session
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
