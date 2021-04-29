import {Injectable} from '@angular/core';
import {CredentialsInfo} from '../models/credentials-info';
import {SessionService} from '../services/session.service';
import {WorkspaceService} from '../services/workspace.service';
import {AwsPlainAccount} from '../models/aws-plain-account';

@Injectable({
  providedIn: 'root'
})
export class AwsPlainService extends SessionService {

  constructor(private workSpaceService: WorkspaceService) {
    super(workSpaceService);
  }

  create(account: AwsPlainAccount, profileId: string) {
    super.create(account, profileId);
  }

  applyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    return Promise.resolve(undefined);
  }
}
