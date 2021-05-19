import {Injectable} from '@angular/core';
import {CredentialsInfo} from '../../models/credentials-info';
import {SessionService} from '../session.service';
import {WorkspaceService} from '../workspace.service';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {KeychainService} from '../keychain.service';
import {environment} from '../../../environments/environment';
import {Session} from '../../models/session';
import {AppService, LoggerLevel} from '../app.service';
import AWS from 'aws-sdk';
import {GetSessionTokenResponse} from 'aws-sdk/clients/sts';
import {FileService} from '../file.service';
import {LeappBaseError} from '../../errors/leapp-base-error';

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

  static isTokenExpired(tokenExpiration: Date): boolean {
    const now = Date.now();
    return now - tokenExpiration.getTime() > environment.sessionTokenDuration;
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
    const session = new Session(new AwsPlainAccount(accountRequest.accountName, accountRequest.region, accountRequest.mfaDevice), profileId);
    this.keychainService.saveSecret(environment.appName, `${session.sessionId}-plain-aws-session-access-key-id`, accountRequest.accessKey);
    this.keychainService.saveSecret(environment.appName, `${session.sessionId}-plain-aws-session-secret-access-key`, accountRequest.secretKey);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName(session.profileId);
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
    const profileName = this.workspaceService.getProfileName(session.profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    try {
      // Get the session in question
      const session = this.get(sessionId);
      // Retrieve session token expiration
      const tokenExpiration = new Date((session.account as AwsPlainAccount).sessionTokenExpiration);
      // Check if token is expired
      if (tokenExpiration && AwsPlainService.isTokenExpired(tokenExpiration)) {
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
        let params = { DurationSeconds: environment.sessionTokenDuration };
        // Check if MFA is needed or not
        if ((session.account as AwsPlainAccount).mfaDevice) {
          this.appService.inputDialog('Multi-factor Authentication', 'insert your code...', 'Add your MFA code', (code) => {

          });

          // TODO: define and open MFA modal
          //  - prompt for mfa token
          //  - configure sts get-session-token api call params
          //  - SerialNumber = MFA device
          //  - TokenCode
          //  - Add Parameters to params
          params = params;
        }

        // Invoke sts get-session-token api
        const getSessionTokenResponse: GetSessionTokenResponse = await sts.getSessionToken(params).promise();
        // Return Session Token
        return AwsPlainService.sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse);
      } else {
        // Session Token is NOT expired
        // Retrieve from credential file

      }
    } catch (err) {
      throw new LeappBaseError('Get Session token error', this, LoggerLevel.error, err.message, err.stack);
    }
  }

  private async getAccessKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}-plain-aws-session-access-key-id`);
  }

  private async getSecretKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}-plain-aws-session-secret-access-key`);
  }
}
