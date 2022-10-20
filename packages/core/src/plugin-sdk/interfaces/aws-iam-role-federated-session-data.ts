import { SessionData } from "./session-data";
import { SessionType } from "../../models/session-type";
import { AwsIamRoleFederatedSessionRequest } from "../../services/session/aws/aws-iam-role-federated-session-request";

export class AwsIamRoleFederatedSessionData extends SessionData {
  /**
   * @param idpArn - the ARN of the AWS IAM Identity Provider used to federate the external Identity Provider with the Service Provider, i.e. AWS.
   * @param idpUrlId - ID of the IdP URL that is going to be associated with the Leapp Session; it refers to an internal ID rather than the name assigned by the user.
   * When instantiating this class, use the method getIdpUrlIdByUrl() to obtain the IdP URL ID by passing the URL.
   * @param profileId - ID of the Named Profile that is going to be associated with the Leapp Session; it refers to an internal ID rather than the name assigned by the user.
   * When instantiating this class, use the method getProfileIdByName() to obtain the Named Profile ID by passing its name.
   * @param region - the region associated with the Leapp Session
   * @param roleArn - the ARN of the Role that has to be assumed through Leapp via SAML 2.0 federation between the external IdP and AWS.
   * The Role trusts the AWS IAM Identity Provider (identified by the idpArn parameter) via a {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_terms-and-concepts.html|Trust Policy}.
   * @param sessionName - the name of the Leapp Session
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
