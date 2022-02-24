import {Injectable} from '@angular/core';
import {AwsSessionService} from '../aws-session.service';
import {WorkspaceService} from '../../../workspace.service';
import {CredentialsInfo} from '../../../../models/credentials-info';
import {AwsSsoRoleSession} from '../../../../models/aws-sso-role-session';
import {FileService} from '../../../file.service';
import {AppService} from '../../../app.service';

import SSO, {
  GetRoleCredentialsRequest,
  GetRoleCredentialsResponse
} from 'aws-sdk/clients/sso';

import {AwsSsoOidcService, BrowserWindowClosing} from '../../../aws-sso-oidc.service';
import {AwsSsoIntegrationService} from '../../../aws-sso-integration.service';

// TODO: move the following interfaces under models
export interface AwsSsoRoleSessionRequest {
  sessionName: string;
  region: string;
  email: string;
  roleArn: string;
  awsSsoConfigurationId: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class AwsSsoRoleService extends AwsSessionService implements BrowserWindowClosing {

  private ssoPortal: SSO;

  constructor(
    private appService: AppService,
    private awsSsoOidcService: AwsSsoOidcService,
    private fileService: FileService,
    protected workspaceService: WorkspaceService,
  ) {
    super(workspaceService);
    this.awsSsoOidcService.listeners.push(this);
  }

  static sessionTokenFromGetSessionTokenResponse(getRoleCredentialResponse: SSO.GetRoleCredentialsResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: getRoleCredentialResponse.roleCredentials.accessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: getRoleCredentialResponse.roleCredentials.secretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: getRoleCredentialResponse.roleCredentials.sessionToken.trim(),
      }
    };
  }

  create(accountRequest: AwsSsoRoleSessionRequest, profileId: string): void {
    const session = new AwsSsoRoleSession(accountRequest.sessionName, accountRequest.region, accountRequest.roleArn, profileId, accountRequest.awsSsoConfigurationId, accountRequest.email);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsSsoRoleSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region
    };
    return await this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsSsoRoleSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    const awsSsoConfiguration = this.workspaceService.getAwsSsoIntegration((this.get(sessionId) as AwsSsoRoleSession).awsSsoConfigurationId);
    const region = awsSsoConfiguration.region;
    const roleArn = (this.get(sessionId) as AwsSsoRoleSession).roleArn;

    await AwsSsoIntegrationService.getInstance().login(awsSsoConfiguration.id);
    const awsSsoIntegrationTokenInfo = await AwsSsoIntegrationService.getInstance().getAwsSsoIntegrationTokenInfo(awsSsoConfiguration.id);
    const accessToken = awsSsoIntegrationTokenInfo.accessToken;
    const credentials = await this.getRoleCredentials(accessToken, region, roleArn);

    return AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(credentials);
  }

  sessionDeactivated(sessionId: string) {
    super.sessionDeactivated(sessionId);
  }

  removeSecrets(sessionId: string): void {}

  async catchClosingBrowserWindow(): Promise<void> {
    // Get all current sessions if any
    const sessions = this.listAwsSsoRoles();

    for (let i = 0; i < sessions.length; i++) {
      // Stop sessions
      const sess = sessions[i];
      await this.stop(sess.sessionId).then(_ => {});
    }
  }

  interrupt() {
    this.awsSsoOidcService.interrupt();
  }

  async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.getSsoPortalClient(region);

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split('/')[1],
      accessToken
    };

    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise();
  }

  // TODO: move to SsoPortalSingleton
  private getSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region});
    }
  }
}
