import { BrowserWindowClosing } from "../../../interfaces/i-browser-window-closing";
import { INativeService } from "../../../interfaces/i-native-service";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AwsSsoRoleSession } from "../../../models/aws/aws-sso-role-session";
import { CredentialsInfo } from "../../../models/credentials-info";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { AwsSessionService } from "./aws-session-service";
import { AwsSsoOidcService } from "../../aws-sso-oidc.service";
import { AwsSsoRoleSessionRequest } from "./aws-sso-role-session-request";
import { IAwsIntegrationDelegate } from "../../../interfaces/i-aws-integration-delegate";
import { SessionType } from "../../../models/session-type";
import { Session } from "../../../models/session";
import { IKeychainService } from "../../../interfaces/i-keychain-service";
import { LoggedException, LogLevel } from "../../log-service";
import { CreateSessionRequest } from "../create-session-request";
import { GetRoleCredentialsResponse } from "@aws-sdk/client-sso";

export interface GenerateSSOTokenResponse {
  accessToken: string;
  expirationTime: Date;
}

export interface LoginResponse {
  accessToken: string;
  region: string;
  expirationTime: Date;
  portalUrlUnrolled: string;
}

export interface RegisterClientResponse {
  clientId?: string;
  clientSecret?: string;
  clientIdIssuedAt?: number;
  clientSecretExpiresAt?: number;
}

export interface StartDeviceAuthorizationResponse {
  deviceCode?: string;
  expiresIn?: number;
  interval?: number;
  userCode?: string;
  verificationUri?: string;
  verificationUriComplete?: string;
}

export interface VerificationResponse {
  clientId: string;
  clientSecret: string;
  deviceCode: string;
}

export interface SsoRoleSession {
  sessionName: string;
  roleArn: string;
  email: string;
  region: string;
  profileId: string;
  awsSsoConfigurationId: string;
}

export class AwsSsoRoleService extends AwsSessionService implements BrowserWindowClosing {
  private awsIntegrationDelegate: IAwsIntegrationDelegate;

  constructor(
    protected sessionNotifier: IBehaviouralNotifier,
    protected repository: Repository,
    fileService: FileService,
    private keyChainService: IKeychainService,
    awsCoreService: AwsCoreService,
    private nativeService: INativeService,
    private awsSsoOidcService: AwsSsoOidcService
  ) {
    super(sessionNotifier, repository, awsCoreService, fileService);
    awsSsoOidcService.appendListener(this);
  }

  static sessionTokenFromGetSessionTokenResponse(getRoleCredentialResponse: GetRoleCredentialsResponse): { sessionToken: any } {
    return {
      sessionToken: {
        ["aws_access_key_id"]: getRoleCredentialResponse.roleCredentials.accessKeyId.trim(),
        ["aws_secret_access_key"]: getRoleCredentialResponse.roleCredentials.secretAccessKey.trim(),
        ["aws_session_token"]: getRoleCredentialResponse.roleCredentials.sessionToken.trim(),
      },
    };
  }

  setAwsIntegrationDelegate(delegate: IAwsIntegrationDelegate): void {
    this.awsIntegrationDelegate = delegate;
  }

  async catchClosingBrowserWindow(): Promise<void> {
    const sessions = this.repository.listAwsSsoRoles();
    for (let i = 0; i < sessions.length; i++) {
      // Stop session
      const currentSession = sessions[i];
      await this.stop(currentSession.sessionId).then((_) => {});
    }
  }

  async create(request: AwsSsoRoleSessionRequest): Promise<void> {
    const session = new AwsSsoRoleSession(
      request.sessionName,
      request.region,
      request.roleArn,
      request.profileId,
      request.awsSsoConfigurationId,
      request.email
    );

    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
  }

  update(_: string, __: CreateSessionRequest): Promise<void> {
    throw new LoggedException(`Update is not supported for AWS SSO Role Session Type`, this, LogLevel.error, false);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsSsoRoleSession).profileId);
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
    const profileName = this.repository.getProfileName((session as AwsSsoRoleSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    const session: AwsSsoRoleSession = this.repository.getSessionById(sessionId) as AwsSsoRoleSession;
    const awsSsoConfiguration = this.repository.getAwsSsoIntegration(session.awsSsoConfigurationId);
    const region = awsSsoConfiguration.region;
    const portalUrl = awsSsoConfiguration.portalUrl;
    const roleArn = session.roleArn;

    let accessToken = await this.awsIntegrationDelegate.getAccessToken(session.awsSsoConfigurationId, region, portalUrl);
    let credentials;

    try {
      credentials = await this.awsIntegrationDelegate.getRoleCredentials(accessToken, region, roleArn);
    } catch (err) {
      accessToken = await this.awsIntegrationDelegate.getAccessToken(session.awsSsoConfigurationId, region, portalUrl, true);
      credentials = await this.awsIntegrationDelegate.getRoleCredentials(accessToken, region, roleArn);
    }

    const awsCredentials: any = {
      ["accessKeyId"]: credentials.roleCredentials.accessKeyId,
      ["secretAccessKey"]: credentials.roleCredentials.secretAccessKey,
      ["sessionToken"]: credentials.roleCredentials.sessionToken,
      ["expiration"]: new Date(credentials.roleCredentials.expiration),
    };

    // Save session token expiration
    this.saveSessionTokenExpirationInTheSession(session, awsCredentials);

    return AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(credentials);
  }

  async getAccountNumberFromCallerIdentity(session: AwsSsoRoleSession): Promise<string> {
    if (session.type === SessionType.awsSsoRole) {
      return `${session.roleArn.split("/")[0].substring(13, 25)}`;
    } else {
      throw new Error("AWS SSO Role Session required");
    }
  }

  sessionDeactivated(sessionId: string): void {
    super.sessionDeactivated(sessionId);
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

  async getCloneRequest(session: AwsSsoRoleSession): Promise<AwsSsoRoleSessionRequest> {
    throw new LoggedException(`Clone is not supported for sessionType ${session.type}`, this, LogLevel.error, false);
  }

  private saveSessionTokenExpirationInTheSession(session: Session, credentials: any): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (credentials !== undefined) {
      currentSession.sessionTokenExpiration = credentials.expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
