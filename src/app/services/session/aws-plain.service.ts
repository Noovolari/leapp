import {Injectable} from '@angular/core';
import {CredentialsInfo} from '../../models/credentials-info';
import {SessionService} from '../session.service';
import {WorkspaceService} from '../workspace.service';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {KeychainService} from '../keychain.service';
import {environment} from '../../../environments/environment';
import {Session} from '../../models/session';
import {AccountType} from '../../models/AccountType';

interface AwsPlainAccountRequest {
  accountName: string;
  accessKey: string;
  secretKey: string;
  region: string;
  mfaDevice?: string;
  type: AccountType;
}

@Injectable({
  providedIn: 'root'
})
export class AwsPlainService extends SessionService {

  constructor(private workSpaceService: WorkspaceService, private keychainService: KeychainService) {
    super(workSpaceService);
  }

  create(accountRequest: AwsPlainAccountRequest, profileId: string) {
    const session = new Session(new AwsPlainAccount(accountRequest.accountName, accountRequest.region, accountRequest.mfaDevice), profileId);
    this.saveAccountInfoInKeychain(session, accountRequest);
    this.addSession(session);
  }

  applyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  deApplyCredentials(sessionId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    return Promise.resolve(undefined);
  }

  private async saveAccountInfoInKeychain(session: Session, accountRequest: AwsPlainAccountRequest) {
    await this.keychainService.saveSecret(environment.appName, `${session.sessionId}_access_key`, accountRequest.accessKey);
    await this.keychainService.saveSecret(environment.appName, `${session.sessionId}_secret_key`, accountRequest.secretKey);
  }

  private async getAccessKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}_access_key`);
  }

  private async getSecretKeyFromKeychain(sessionId: string): Promise<string> {
    return await this.keychainService.getSecret(environment.appName, `${sessionId}_secret_key`);
  }
}
