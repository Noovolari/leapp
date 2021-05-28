import { Injectable } from '@angular/core';
import {SessionService} from '../session.service';
import {WorkspaceService} from '../workspace.service';
import {CredentialsInfo} from '../../models/credentials-info';
import {AwsSsoSessionProviderService} from '../providers/aws-sso-session-provider.service';
import {AwsSsoSession} from '../../models/aws-sso-session';
import {FileService} from '../file.service';
import {AppService} from '../app.service';

export interface AwsSsoSessionRequest {
  sessionName: string;
  region: string;
  email: string;
  roleArn: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsSsoService extends SessionService {

  constructor(
    protected workspaceService: WorkspaceService,
    private awsSsoSessionProviderService: AwsSsoSessionProviderService,
    private fileService: FileService,
    private appService: AppService
  ) {
    super(workspaceService);
  }

  create(accountRequest: AwsSsoSessionRequest, profileId: string): void {
    const session = new AwsSsoSession(accountRequest.sessionName, accountRequest.region, accountRequest.roleArn, profileId, accountRequest.email);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsSsoSession).profileId);
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
    const profileName = this.workspaceService.getProfileName((session as AwsSsoSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // TODO: implement in a clean way the strategy generateCredentials
    //  - login to portal to verify that you can still access to sso portal
    //  - if yes
    return Promise.resolve(undefined);
  }
}
