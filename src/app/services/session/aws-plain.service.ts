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

  create(accountRequest: AwsPlainAccountRequest, profileId: string) {
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
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.account.region
    };
    return await this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName(session.profileId);
    console.log(profileName);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    console.log(credentialsFile);
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    const session = this.get(sessionId);
    AWS.config.update({
      accessKeyId: await this.getAccessKeyFromKeychain(sessionId),
      secretAccessKey: await this.getSecretKeyFromKeychain(sessionId)
    });
    const sts = new AWS.STS(this.appService.stsOptions(session));
    const params = { DurationSeconds: environment.sessionTokenDuration };

    if ((session.account as AwsPlainAccount).mfaDevice) {
      // TODO: define and open MFA modal
      return Promise.resolve(undefined);
    } else {
      try {
        const getSessionToken: GetSessionTokenResponse = await sts.getSessionToken(params).promise()
        return {
          sessionToken: {
            aws_access_key_id: getSessionToken.Credentials.AccessKeyId.trim(),
            aws_secret_access_key: getSessionToken.Credentials.SecretAccessKey.trim(),
            aws_session_token: getSessionToken.Credentials.SessionToken.trim(),
          }
        };
      } catch (err) {

      }
    }
  }


  private async getAccessKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}-plain-aws-session-access-key-id`);
  }

  private async getSecretKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}-plain-aws-session-secret-access-key`);
  }

}
