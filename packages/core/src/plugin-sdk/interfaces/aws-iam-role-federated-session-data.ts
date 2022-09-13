import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamRoleFederatedSessionRequest } from "../../services/session/aws/aws-iam-role-federated-session-request";

export class AwsIamRoleFederatedSessionData extends SessionData {
  /**
   * The profileId and idpUrlId fields refer to an internal ID rather than the name assigned by the user
   * When instanciating this class, use the method getProfileIdByName() and getIdpUrlIdByUrl() to obtain the IDs from the name of the profile or
   * the url of the federation
   */
  constructor(
    public idpArn: string,
    public idpUrlId: string,
    public profileId: string,
    public region: string,
    public roleArn: string,
    public sessionName: string
  ) {
    super(SessionType.awsIamRoleFederated);
  }

  getCreationRequest(): AwsIamRoleFederatedSessionRequest {
    return {
      profileId: this.profileId,
      region: this.region,
      sessionName: this.sessionName,
      roleArn: this.roleArn,
      idpUrl: this.idpUrlId,
      idpArn: this.idpArn,
    };
  }
}
