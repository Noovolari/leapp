import * as Aws from "aws-sdk";
import { IAwsSamlAuthenticationService } from "../../../interfaces/i-aws-saml-authentication-service";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AwsIamRoleFederatedSession } from "../../../models/aws/aws-iam-role-federated-session";
import { CredentialsInfo } from "../../../models/credentials-info";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { AwsIamRoleFederatedSessionRequest } from "./aws-iam-role-federated-session-request";
import { AwsSessionService } from "./aws-session-service";
import { SessionType } from "../../../models/session-type";
import { Session } from "../../../models/session";
import * as AWS from "aws-sdk";
import { LoggedException, LogLevel } from "../../log-service";
import { STS } from "aws-sdk";

export class AwsIamRoleFederatedService extends AwsSessionService {
  constructor(
    iSessionNotifier: IBehaviouralNotifier,
    repository: Repository,
    fileService: FileService,
    awsCoreService: AwsCoreService,
    private awsAuthenticationService: IAwsSamlAuthenticationService,
    private samlRoleSessionDuration: number
  ) {
    super(iSessionNotifier, repository, awsCoreService, fileService);
  }

  static sessionTokenFromGetSessionTokenResponse(assumeRoleResponse: Aws.STS.AssumeRoleWithSAMLResponse): { sessionToken: any } {
    return {
      sessionToken: {
        ["aws_access_key_id"]: assumeRoleResponse.Credentials.AccessKeyId.trim(),
        ["aws_secret_access_key"]: assumeRoleResponse.Credentials.SecretAccessKey.trim(),
        ["aws_session_token"]: assumeRoleResponse.Credentials.SessionToken.trim(),
      },
    };
  }

  async create(request: AwsIamRoleFederatedSessionRequest): Promise<void> {
    const session = new AwsIamRoleFederatedSession(
      request.sessionName,
      request.region,
      request.idpUrl,
      request.idpArn,
      request.roleArn,
      request.profileId
    );
    if (request.sessionId) {
      session.sessionId = request.sessionId;
    }

    if (request.awsAccount) {
      session.awsAccount = request.awsAccount;
    }

    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
  }

  async update(sessionId: string, updateRequest: AwsIamRoleFederatedSessionRequest): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsIamRoleFederatedSession;
    if (session) {
      session.sessionName = updateRequest.sessionName;
      session.region = updateRequest.region;
      session.roleArn = updateRequest.roleArn;
      session.idpUrlId = updateRequest.idpUrl;
      session.idpArn = updateRequest.idpArn;
      session.profileId = updateRequest.profileId;
      this.repository.updateSession(sessionId, session);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
    }
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleFederatedSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      ["aws_access_key_id"]: credentialsInfo.sessionToken.aws_access_key_id,
      ["aws_secret_access_key"]: credentialsInfo.sessionToken.aws_secret_access_key,
      ["aws_session_token"]: credentialsInfo.sessionToken.aws_session_token,
      region: session.region,
    };
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleFederatedSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  generateCredentialsProxy(sessionId: string): Promise<CredentialsInfo> {
    return this.generateCredentials(sessionId);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Get the session in question
    const session = this.repository.getSessionById(sessionId);

    let idpUrl;
    // Check if we need to authenticate
    let needToAuthenticate;
    try {
      // Get idpUrl
      idpUrl = this.repository.getIdpUrl((session as AwsIamRoleFederatedSession).idpUrlId);
      needToAuthenticate = await this.awsAuthenticationService.needAuthentication(idpUrl);
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }

    // AwsSignIn: retrieve the response hook
    const samlResponse = await this.awsAuthenticationService.awsSignIn(idpUrl, needToAuthenticate);

    // Setup STS to generate the credentials
    const sts = new Aws.STS(this.awsCoreService.stsOptions(session));

    // Params for the calls
    const params = {
      ["PrincipalArn"]: (session as AwsIamRoleFederatedSession).idpArn,
      ["RoleArn"]: (session as AwsIamRoleFederatedSession).roleArn,
      ["SAMLAssertion"]: samlResponse,
      ["DurationSeconds"]: this.samlRoleSessionDuration,
    };

    // Invoke assumeRoleWithSAML
    const assumeRoleWithSamlResponse = await this.assumeRoleWithSAML(sts, params);

    // Save session token expiration
    this.saveSessionTokenExpirationInTheSession(session, assumeRoleWithSamlResponse.Credentials);

    // Generate credentials
    return AwsIamRoleFederatedService.sessionTokenFromGetSessionTokenResponse(assumeRoleWithSamlResponse);
  }

  async getAccountNumberFromCallerIdentity(session: AwsIamRoleFederatedSession): Promise<string> {
    if (session.type === SessionType.awsIamRoleFederated) {
      return `${session.roleArn.split("/")[0].substring(13, 25)}`;
    } else {
      throw new Error("AWS IAM Role Federated Session required");
    }
  }

  validateCredentials(sessionId: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      this.generateCredentials(sessionId)
        .then((__) => {
          resolve(true);
        })
        .catch((__) => {
          resolve(false);
        });
    });
  }

  removeSecrets(_: string): void {}

  async getCloneRequest(session: AwsIamRoleFederatedSession): Promise<AwsIamRoleFederatedSessionRequest> {
    return {
      profileId: session.profileId,
      region: session.region,
      sessionName: session.sessionName,
      roleArn: session.roleArn,
      idpArn: session.idpArn,
      idpUrl: session.idpUrlId,
    };
  }

  private async assumeRoleWithSAML(
    sts: STS,
    params: { ["SAMLAssertion"]: string; ["PrincipalArn"]: string; ["DurationSeconds"]: number; ["RoleArn"]: string }
  ): Promise<STS.Types.AssumeRoleWithSAMLResponse> {
    try {
      return await sts.assumeRoleWithSAML(params).promise();
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }

  private saveSessionTokenExpirationInTheSession(session: Session, credentials: AWS.STS.Credentials): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (credentials !== undefined) {
      currentSession.sessionTokenExpiration = credentials.Expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
