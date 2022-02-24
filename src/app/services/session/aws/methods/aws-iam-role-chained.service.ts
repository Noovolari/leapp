import {Injectable} from '@angular/core';
import {AwsSessionService} from '../aws-session.service';
import {CredentialsInfo} from '../../../../models/credentials-info';
import {WorkspaceService} from '../../../workspace.service';
import {FileService} from '../../../file.service';
import {AppService} from '../../../app.service';
import {LeappNotFoundError} from '../../../../errors/leapp-not-found-error';
import {Session} from '../../../../models/session';
import {AwsIamRoleChainedSession} from '../../../../models/aws-iam-role-chained-session';
import {LeappAwsStsError} from '../../../../errors/leapp-aws-sts-error';
import * as AWS from 'aws-sdk';
import {SessionType} from '../../../../models/session-type';
import {AwsIamRoleFederatedService} from './aws-iam-role-federated.service';
import {KeychainService} from '../../../keychain.service';
import {AwsIamUserService} from './aws-iam-user.service';
import {AwsSsoRoleService} from './aws-sso-role.service';
import {ElectronService} from '../../../electron.service';
import {AwsSsoOidcService} from '../../../aws-sso-oidc.service';

export interface AwsIamRoleChainedSessionRequest {
  accountName: string;
  region: string;
  roleArn: string;
  roleSessionName?: string;
  parentSessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsIamRoleChainedService extends AwsSessionService {

  constructor(
    private appService: AppService,
    private awsSsoOidcService: AwsSsoOidcService,
    private electronService: ElectronService,
    private fileService: FileService,
    private keychainService: KeychainService,
    protected workspaceService: WorkspaceService
  ) {
    super(workspaceService);
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
      }
    };
  }

  create(sessionRequest: AwsIamRoleChainedSessionRequest, profileId: string): void {
    const session = new AwsIamRoleChainedSession(sessionRequest.accountName, sessionRequest.region, sessionRequest.roleArn, profileId, sessionRequest.parentSessionId, sessionRequest.roleSessionName);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsIamRoleChainedSession).profileId);
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
    const profileName = this.workspaceService.getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Retrieve Session
    const session = this.get(sessionId);

    // Retrieve Parent Session
    let parentSession: Session;
    try {
      parentSession = this.get((session as AwsIamRoleChainedSession).parentSessionId);
    } catch (err) {
      throw new LeappNotFoundError(this, `Parent Account Session  not found for Chained Account ${session.sessionName}`);
    }

    // Generate a credential set from Parent Session
    let parentSessionService;
    if(parentSession.type === SessionType.awsIamRoleFederated) {
      parentSessionService = new AwsIamRoleFederatedService(this.workspaceService, this.keychainService, this.appService, this.fileService) as AwsSessionService;
    } else if(parentSession.type === SessionType.awsIamUser) {
      parentSessionService = new AwsIamUserService(this.workspaceService, this.keychainService, this.appService, this.fileService) as AwsSessionService;
    } else if(parentSession.type === SessionType.awsSsoRole) {
      parentSessionService = new AwsSsoRoleService(this.appService, this.awsSsoOidcService, this.fileService, this.workspaceService) as AwsSessionService;
    }

    const parentCredentialsInfo = await parentSessionService.generateCredentials(parentSession.sessionId);

    // Make second jump: configure aws SDK with parent credentials set
    AWS.config.update({
      sessionToken: parentCredentialsInfo.sessionToken.aws_session_token,
      accessKeyId: parentCredentialsInfo.sessionToken.aws_access_key_id,
      secretAccessKey: parentCredentialsInfo.sessionToken.aws_secret_access_key,
    });

    // Assume Role from parent
    // Prepare sessions credentials set parameters and client
    const sts = new AWS.STS(this.appService.stsOptions(session));

    // Configure IamRoleChained Account sessions parameters
    const roleSessionName = (session as AwsIamRoleChainedSession).roleSessionName;
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleSessionName: roleSessionName ? roleSessionName : 'assumed-from-leapp',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleArn: (session as AwsIamRoleChainedSession).roleArn,
    };

    // Generate Session token
    return this.generateSessionToken(sts, params);
  }

  removeSecrets(sessionId: string): void {}

  private async generateSessionToken(sts, params): Promise<CredentialsInfo> {
    try {
      // Assume Role
      const assumeRoleResponse: AssumeRoleResponse = await sts.assumeRole(params).promise();
      // Generate correct object from sessions token response and return
      return AwsIamRoleChainedService.sessionTokenFromAssumeRoleResponse(assumeRoleResponse);
    } catch (err) {
      throw new LeappAwsStsError(this, err.message);
    }
  }
}
