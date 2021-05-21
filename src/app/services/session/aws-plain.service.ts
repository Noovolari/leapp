import {Injectable} from '@angular/core';
import {CredentialsInfo} from '../../models/credentials-info';
import {SessionService} from '../session.service';
import {WorkspaceService} from '../workspace.service';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {KeychainService} from '../keychain.service';
import {environment} from '../../../environments/environment';
import {Session} from '../../models/session';
import {AppService} from '../app.service';
import AWS from 'aws-sdk';
import {GetSessionTokenResponse} from 'aws-sdk/clients/sts';
import {FileService} from '../file.service';
import {Constants} from '../../models/constants';
import {LeappModalClosedError} from '../../errors/leapp-modal-closed-error';
import {LeappAwsStsError} from '../../errors/leapp-aws-sts-error';
import {LeappParseError} from '../../errors/leapp-parse-error';

export interface AwsPlainAccountRequest {
  accountName: string;
  accessKey: string;
  secretKey: string;
  region: string;
  mfaDevice?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsPlainService extends SessionService {

  constructor(
    protected workspaceService: WorkspaceService,
    private keychainService: KeychainService,
    private appService: AppService,
    private fileService: FileService) {
    super(workspaceService);
  }

  static isTokenExpired(tokenExpiration: string): boolean {
    const now = Date.now();
    return now > new Date(tokenExpiration).getTime();
  }

  static sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse: GetSessionTokenResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: getSessionTokenResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: getSessionTokenResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: getSessionTokenResponse.Credentials.SessionToken.trim(),
      }
    };
  }

  create(accountRequest: AwsPlainAccountRequest, profileId: string): void {
    const session = new Session(new AwsPlainAccount(accountRequest.accountName, accountRequest.region, accountRequest.mfaDevice, profileId));
    this.keychainService.saveSecret(environment.appName, `${session.sessionId}-plain-aws-session-access-key-id`, accountRequest.accessKey);
    this.keychainService.saveSecret(environment.appName, `${session.sessionId}-plain-aws-session-secret-access-key`, accountRequest.secretKey);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session.account as AwsPlainAccount).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.account.region
    };
    return await this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session.account as AwsPlainAccount).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
      // Get the session in question
      const session = this.get(sessionId);
      // Retrieve session token expiration
      const tokenExpiration = (session.account as AwsPlainAccount).sessionTokenExpiration;
      // Check if token is expired
      if (!tokenExpiration || AwsPlainService.isTokenExpired(tokenExpiration)) {
        // Token is Expired!
        // Retrieve access keys from keychain
        const accessKeyId = await this.getAccessKeyFromKeychain(sessionId);
        const secretAccessKey = await this.getSecretKeyFromKeychain(sessionId);
        // Get session token
        // https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html
        AWS.config.update({ accessKeyId, secretAccessKey });
        // Configure sts client options
        const sts = new AWS.STS(this.appService.stsOptions(session));
        // Configure sts get-session-token api call params
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const params = { DurationSeconds: environment.sessionTokenDuration };
        // Check if MFA is needed or not
        if ((session.account as AwsPlainAccount).mfaDevice) {
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
          return JSON.parse(await this.keychainService.getSecret(environment.appName, `${session.sessionId}-plain-aws-session-token`));
        } catch (err) {
          throw new LeappParseError(this, err.message);
        }
      }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private generateSessionTokenCallingMfaModal( session: Session, sts: AWS.STS, params: { DurationSeconds: number }): Promise<CredentialsInfo> {
    return new Promise((resolve, reject) => {
      this.appService.inputDialog('MFA Code insert', 'Insert MFA Code', 'please insert MFA code from your app or device', (value) => {
        if (value !== Constants.confirmClosed) {
          params['SerialNumber'] = (session.account as AwsPlainAccount).mfaDevice;
          params['TokenCode'] = value;
          // Return session token in the form of CredentialsInfo
          console.log(session, params);
          resolve(this.generateSessionToken(session, sts, params));
        } else {
          reject(new LeappModalClosedError(this, 'Closed Mfa Modal'));
        }
      });
    });
  }

  private async getAccessKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}-plain-aws-session-access-key-id`);
  }

  private async getSecretKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}-plain-aws-session-secret-access-key`);
  }

  private async generateSessionToken(session: Session, sts: AWS.STS, params: any): Promise<CredentialsInfo> {
    try {
      // Invoke sts get-session-token api
      const getSessionTokenResponse: GetSessionTokenResponse = await sts.getSessionToken(params).promise();

      // Save session token expiration
      this.saveSessionTokenResponseInTheSession(session, getSessionTokenResponse);

      // Generate correct object from session token response
      const sessionToken = AwsPlainService.sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse);

      // Save in keychain the session token
      await this.keychainService.saveSecret(environment.appName, `${session.sessionId}-plain-aws-session-token`, JSON.stringify(sessionToken));

      // Return Session Token
      return sessionToken;
    } catch (err) {
      throw new LeappAwsStsError(this, err.message);
    }
  }

  private saveSessionTokenResponseInTheSession(session: Session, getSessionTokenResponse: AWS.STS.GetSessionTokenResponse): void {
    const index = this.workspaceService.sessions.indexOf(session);
    const currentSession: Session = this.workspaceService.sessions[index];
    (currentSession.account as AwsPlainAccount).sessionTokenExpiration = getSessionTokenResponse.Credentials.Expiration.toISOString();
    this.workspaceService.sessions[index] = currentSession;
    this.workspaceService.sessions = [...this.workspaceService.sessions];
  }
}
