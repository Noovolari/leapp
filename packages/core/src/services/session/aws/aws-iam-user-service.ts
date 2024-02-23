// import * as AWS from "aws-sdk";
// import { GetSessionTokenResponse } from "aws-sdk/clients/sts";
import { STSClient, Credentials, GetSessionTokenResponse, GetCallerIdentityCommand, GetSessionTokenCommand } from "@aws-sdk/client-sts";

import { IMfaCodePrompter } from "../../../interfaces/i-mfa-code-prompter";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AwsIamUserSession } from "../../../models/aws/aws-iam-user-session";
import { constants } from "../../../models/constants";
import { Credentials as LeappCredentials } from "../../../models/credentials";
import { CredentialsInfo } from "../../../models/credentials-info";
import { Session } from "../../../models/session";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { AwsIamUserSessionRequest } from "./aws-iam-user-session-request";
import { AwsSessionService } from "./aws-session-service";
import { LoggedException, LogLevel } from "../../log-service";
import { IKeychainService } from "../../../interfaces/i-keychain-service";

export interface GenerateSessionTokenCallingMfaParams {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DurationSeconds: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SerialNumber?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TokenCode?: string;
}

export class AwsIamUserService extends AwsSessionService {
  private mfaCodePrompterProxy: IMfaCodePrompter;

  constructor(
    iSessionNotifier: IBehaviouralNotifier,
    repository: Repository,
    private localMfaCodePrompter: IMfaCodePrompter,
    private remoteMfaCodePrompter: IMfaCodePrompter,
    private keychainService: IKeychainService,
    fileService: FileService,
    awsCoreService: AwsCoreService
  ) {
    super(iSessionNotifier, repository, awsCoreService, fileService);
    this.mfaCodePrompterProxy = localMfaCodePrompter;
  }

  static isTokenExpired(tokenExpiration: string): boolean {
    const now = Date.now();
    return now > new Date(tokenExpiration).getTime();
  }

  static sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse: GetSessionTokenResponse): { sessionToken: any } {
    if (getSessionTokenResponse.Credentials === undefined) {
      throw new LoggedException("an error occurred during session token generation.", this, LogLevel.warn);
    }
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: getSessionTokenResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: getSessionTokenResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: getSessionTokenResponse.Credentials.SessionToken.trim(),
      },
    };
  }

  async create(request: AwsIamUserSessionRequest): Promise<void> {
    const session = new AwsIamUserSession(request.sessionName, request.region, request.profileId, request.mfaDevice);
    if (request.sessionId) {
      session.sessionId = request.sessionId;
    }

    if (request.awsAccount) {
      session.awsAccount = request.awsAccount;
    }

    await this.keychainService.saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-access-key-id`, request.accessKey);
    await this.keychainService.saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-secret-access-key`, request.secretKey);
    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
  }

  async update(sessionId: string, updateRequest: AwsIamUserSessionRequest): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsIamUserSession;
    if (session) {
      session.sessionName = updateRequest.sessionName;
      session.region = updateRequest.region;
      session.mfaDevice = updateRequest.mfaDevice;
      session.profileId = updateRequest.profileId;

      if (updateRequest.accessKey) {
        await this.keychainService.saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-access-key-id`, updateRequest.accessKey);
      }

      if (updateRequest.secretKey) {
        await this.keychainService.saveSecret(
          constants.appName,
          `${session.sessionId}-iam-user-aws-session-secret-access-key`,
          updateRequest.secretKey
        );
      }

      this.repository.updateSession(sessionId, session);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
    }
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamUserSession).profileId);
    const credentialObject: { [key: string]: LeappCredentials } = {};

    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/naming-convention
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
    //const session = this.behaviouralSubjectService.get(sessionId);
    const session = this.repository.getSessions().find((sess) => sess.sessionId === sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamUserSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  generateCredentialsProxy(sessionId: string): Promise<CredentialsInfo> {
    return new Promise<CredentialsInfo>((resolve, reject) => {
      this.mfaCodePrompterProxy = this.remoteMfaCodePrompter;
      this.generateCredentials(sessionId)
        .then((credentialsInfo: CredentialsInfo) => {
          this.mfaCodePrompterProxy = this.localMfaCodePrompter;
          resolve(credentialsInfo);
        })
        .catch((err) => {
          this.mfaCodePrompterProxy = this.localMfaCodePrompter;
          reject(err);
        });
    });
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Get the session in question
    //const session = this.behaviouralSubjectService.get(sessionId);
    const session = this.repository.getSessions().find((sess) => sess.sessionId === sessionId);
    if (session === undefined) {
      throw new LoggedException(`session with id ${sessionId} not found.`, this, LogLevel.warn);
    }

    // Retrieve session token expiration
    const tokenExpiration = session.sessionTokenExpiration;

    // Check if token is expired
    if (!tokenExpiration || AwsIamUserService.isTokenExpired(tokenExpiration)) {
      // Token is Expired!
      // Retrieve access keys from keychain
      const accessKeyId = await this.getAccessKeyFromKeychain(sessionId);
      const secretAccessKey = await this.getSecretKeyFromKeychain(sessionId);

      // Get session token
      // https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html
      // AWS.config.update({ accessKeyId, secretAccessKey });
      const credentials = {
        ["AccessKeyId"]: accessKeyId,
        ["SecretAccessKey"]: secretAccessKey,
      } as Credentials;

      // Configure sts client options
      // const sts = new AWS.STS(this.awsCoreService.stsOptions(session));
      const sts = new STSClient(this.awsCoreService.stsOptions(session, true, credentials));

      // Configure sts get-session-token api call params
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const params = { DurationSeconds: constants.sessionTokenDuration };

      // Check if MFA is needed or not
      if ((session as AwsIamUserSession).mfaDevice) {
        // Return session token after calling MFA modal
        return this.generateSessionTokenCallingMfaModal(session, sts, params);
      } else {
        // Return session token in the form of CredentialsInfo
        return this.generateSessionToken(session, sts, params);
      }
    } else {
      // Session Token is NOT expired
      try {
        // Retrieve session token from keychain
        return JSON.parse(await this.keychainService.getSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-token`));
      } catch (err: any) {
        throw new LoggedException(err.message, this, LogLevel.warn);
      }
    }
  }

  async getAccountNumberFromCallerIdentity(session: Session): Promise<string> {
    // Get credentials
    const credentialsInfo: CredentialsInfo = await this.generateCredentials(session.sessionId);
    // AWS.config.update({
    //   accessKeyId: credentials.sessionToken.aws_access_key_id,
    //   secretAccessKey: credentials.sessionToken.aws_secret_access_key,
    //   sessionToken: credentials.sessionToken.aws_session_token,
    // });
    const credentials = {
      ["SessionToken"]: credentialsInfo.sessionToken.aws_session_token,
      ["AccessKeyId"]: credentialsInfo.sessionToken.aws_access_key_id,
      ["SecretAccessKey"]: credentialsInfo.sessionToken.aws_secret_access_key,
    } as Credentials;
    // Configure sts client options
    try {
      // const sts = new AWS.STS(this.awsCoreService.stsOptions(session));
      const sts = new STSClient(this.awsCoreService.stsOptions(session, true, credentials));
      const getCallerIdentityCommand = new GetCallerIdentityCommand({});
      const response = await sts.send(getCallerIdentityCommand);
      // const response = await sts.getCallerIdentity({}).promise();
      return response.Account ?? "";
    } catch (err: any) {
      throw new LoggedException(err.message, this, LogLevel.warn);
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

  async removeSecrets(sessionId: string): Promise<void> {
    await this.removeAccessKeyFromKeychain(sessionId);
    await this.removeSecretKeyFromKeychain(sessionId);
    await this.removeSessionTokenFromKeychain(sessionId);
  }

  async getCloneRequest(session: AwsIamUserSession): Promise<AwsIamUserSessionRequest> {
    const accessKey = await this.getAccessKeyFromKeychain(session.sessionId);
    const secretKey = await this.getSecretKeyFromKeychain(session.sessionId);
    return {
      profileId: session.profileId,
      region: session.region,
      sessionName: session.sessionName,
      accessKey,
      secretKey,
    };
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private generateSessionTokenCallingMfaModal(
    session: Session,
    sts: STSClient,
    params: GenerateSessionTokenCallingMfaParams
  ): Promise<CredentialsInfo> {
    return new Promise((resolve, reject) => {
      // TODO: think about timeout management
      //  handle condition in which mfaCodePrompter is null
      //  convert promptForMFACode into an async function (without callback...)!
      this.mfaCodePrompterProxy.promptForMFACode(session.sessionName, (value: string) => {
        if (value !== constants.confirmClosed) {
          params.SerialNumber = (session as AwsIamUserSession).mfaDevice;
          params.TokenCode = value;
          // Return session token in the form of CredentialsInfo
          resolve(this.generateSessionToken(session, sts, params));
        } else {
          reject(new LoggedException("Missing Multi Factor Authentication code", this, LogLevel.warn));
        }
      });
    });
  }

  private async getAccessKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(constants.appName, `${sessionId}-iam-user-aws-session-access-key-id`);
  }

  private async getSecretKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(constants.appName, `${sessionId}-iam-user-aws-session-secret-access-key`);
  }

  private async removeAccessKeyFromKeychain(sessionId: string): Promise<void> {
    await this.keychainService.deleteSecret(constants.appName, `${sessionId}-iam-user-aws-session-access-key-id`);
  }

  private async removeSecretKeyFromKeychain(sessionId: string): Promise<void> {
    await this.keychainService.deleteSecret(constants.appName, `${sessionId}-iam-user-aws-session-secret-access-key`);
  }

  private async removeSessionTokenFromKeychain(sessionId: string): Promise<void> {
    await this.keychainService.deleteSecret(constants.appName, `${sessionId}-iam-user-aws-session-token`);
  }

  private async generateSessionToken(session: Session, sts: STSClient, params: any): Promise<CredentialsInfo> {
    try {
      // Invoke sts get-session-token api
      // const getSessionTokenResponse: GetSessionTokenResponse = await sts.getSessionToken(params).promise();

      const getSessionTokenCommand = new GetSessionTokenCommand(params);
      const getSessionTokenResponse: GetSessionTokenResponse = await sts.send(getSessionTokenCommand);

      // Save session token expiration
      this.saveSessionTokenExpirationInTheSession(session, getSessionTokenResponse.Credentials);

      // Generate correct object from session token response
      const sessionToken = AwsIamUserService.sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse);

      // Save in keychain the session token
      await this.keychainService.saveSecret(constants.appName, `${session.sessionId}-iam-user-aws-session-token`, JSON.stringify(sessionToken));

      // Return Session Token
      return sessionToken;
    } catch (err: any) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }

  private saveSessionTokenExpirationInTheSession(session: Session, credentials: Credentials): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (credentials) {
      currentSession.sessionTokenExpiration = credentials.Expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
