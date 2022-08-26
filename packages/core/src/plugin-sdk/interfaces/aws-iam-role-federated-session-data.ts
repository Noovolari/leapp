import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamRoleFederatedSessionRequest } from "../../services/session/aws/aws-iam-role-federated-session-request";

export class AwsIamRoleFederatedSessionData extends SessionData {
  constructor(
    public idpArn: string,
    public idpUrl: string,
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
      idpUrl: this.idpUrl,
      idpArn: this.idpArn,
    };
  }
}
