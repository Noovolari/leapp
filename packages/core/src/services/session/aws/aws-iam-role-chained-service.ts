import * as AWS from "aws-sdk";
import { AssumeRoleResponse } from "aws-sdk/clients/sts";
import { LeappAwsStsError } from "../../../errors/leapp-aws-sts-error";
import { LeappNotFoundError } from "../../../errors/leapp-not-found-error";
import { ISessionNotifier } from "../../../interfaces/i-session-notifier";
import { AwsIamRoleChainedSession } from "../../../models/aws-iam-role-chained-session";
import { CredentialsInfo } from "../../../models/credentials-info";
import { Session } from "../../../models/session";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { AwsIamRoleChainedSessionRequest } from "./aws-iam-role-chained-session-request";
import { AwsIamUserService } from "./aws-iam-user-service";
import { AwsParentSessionFactory } from "./aws-parent-session.factory";
import { AwsSessionService } from "./aws-session-service";
import { SessionType } from "../../../models/session-type";
import { AwsIamUserSession } from "../../../models/aws-iam-user-session";
import { constants } from "../../../models/constants";

export class AwsIamRoleChainedService extends AwsSessionService {
  constructor(
    iSessionNotifier: ISessionNotifier,
    repository: Repository,
    awsCoreService: AwsCoreService,
    fileService: FileService,
    private awsIamUserService: AwsIamUserService,
    private parentSessionServiceFactory: AwsParentSessionFactory
  ) {
    super(iSessionNotifier, repository, awsCoreService, fileService);
  }

  static sessionTokenFromAssumeRoleResponse(assumeRoleResponse: AssumeRoleResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: assumeRoleResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: assumeRoleResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: assumeRoleResponse.Credentials.SessionToken.trim(),
      },
    };
  }

  async create(request: AwsIamRoleChainedSessionRequest): Promise<void> {
    const session = new AwsIamRoleChainedSession(
      request.sessionName,
      request.region,
      request.roleArn,
      request.profileId,
      request.parentSessionId,
      request.roleSessionName
    );

    this.repository.addSession(session);
    this.sessionNotifier?.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region,
    };
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  generateCredentialsProxy(sessionId: string): Promise<CredentialsInfo> {
    return this.generateCredentials(sessionId);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Retrieve Session
    const session = this.repository.getSessionById(sessionId);

    // Retrieve Parent Session
    let parentSession: Session;
    try {
      parentSession = this.repository.getSessionById((session as AwsIamRoleChainedSession).parentSessionId);
    } catch (err) {
      throw new LeappNotFoundError(this, `Parent Account Session  not found for Chained Account ${session.sessionName}`);
    }

    // Generate a credential set from Parent Session
    const parentSessionService = this.parentSessionServiceFactory.getSessionService(parentSession.type);
    const parentCredentialsInfo = await parentSessionService.generateCredentialsProxy(parentSession.sessionId);

    // Make second jump: configure aws SDK with parent credentials set
    AWS.config.update({
      sessionToken: parentCredentialsInfo.sessionToken.aws_session_token,
      accessKeyId: parentCredentialsInfo.sessionToken.aws_access_key_id,
      secretAccessKey: parentCredentialsInfo.sessionToken.aws_secret_access_key,
    });

    // Assume Role from parent
    // Prepare session credentials set parameters and client
    const sts = new AWS.STS(this.awsCoreService.stsOptions(session));

    // Configure IamRoleChained Account session parameters
    const roleSessionName = (session as AwsIamRoleChainedSession).roleSessionName;
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleSessionName: roleSessionName ? roleSessionName : constants.roleSessionName,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleArn: (session as AwsIamRoleChainedSession).roleArn,
    };

    // Generate Session token
    return this.generateSessionToken(session, sts, params);
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

  async getAccountNumberFromCallerIdentity(session: AwsIamRoleChainedSession): Promise<string> {
    if (session.type === SessionType.awsIamRoleChained) {
      return `${session.roleArn.split("/")[0].substring(13, 25)}`;
    } else {
      throw new Error("AWS IAM Role Chained Session required");
    }
  }

  private async generateSessionToken(session, sts, params): Promise<CredentialsInfo> {
    try {
      // Assume Role
      const assumeRoleResponse: AssumeRoleResponse = await sts.assumeRole(params).promise();

      // Save session token expiration
      this.saveSessionTokenExpirationInTheSession(session, assumeRoleResponse.Credentials);

      // Generate correct object from session token response and return
      return AwsIamRoleChainedService.sessionTokenFromAssumeRoleResponse(assumeRoleResponse);
    } catch (err) {
      throw new LeappAwsStsError(this, err.message);
    }
  }

  private saveSessionTokenExpirationInTheSession(session: Session, credentials: AWS.STS.Credentials): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (credentials !== undefined) {
      (currentSession as AwsIamUserSession).sessionTokenExpiration = credentials.Expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
