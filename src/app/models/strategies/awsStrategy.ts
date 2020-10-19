import {AccountType} from '../AccountType';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {AwsCredentials} from '../credential';
import {AwsPlainAccount} from '../aws-plain-account';
import {ConfigurationService} from '../../services-system/configuration.service';
import {CredentialsService} from '../../services/credentials.service';
import {environment} from '../../../environments/environment';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {FileService} from '../../services-system/file.service';
import {KeychainService} from '../../services-system/keychain.service';
import {RefreshCredentialsStrategy} from '../refreshCredentialsStrategy';
import {TimerService} from '../../services/timer-service';
import {Workspace} from '../workspace';
import {WorkspaceService} from '../../services/workspace.service';
import {Observable} from 'rxjs';

// Import AWS node style
const AWS = require('aws-sdk');

export class AwsStrategy extends RefreshCredentialsStrategy {

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private keychainService: KeychainService,
    private timerService: TimerService,
    private workspaceService: WorkspaceService) {
    super();
  }

  getActiveSessions(workspace: Workspace) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_PLAIN_USER || sess.account.type === AccountType.AWS) && sess.active;
    });

    console.log('active aws sessions', activeSessions);
    this.appService.logger('Aws Active sessions', LoggerLevel.INFO, this, JSON.stringify(activeSessions, null, 3));
    return activeSessions;
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), {});
      this.timerService.clearTimer();
    }
  }

  manageSingleSession(workspace, session) {
    if (session.account.type === AccountType.AWS_PLAIN_USER) {
      this.awsCredentialProcess(workspace, session);
    } else if (session.account.type === AccountType.AWS) {
      this.awsCredentialFederatedProcess(workspace, session);
    }
  }

  /**
   * In this method we transform plain to temporary to avoid saving plain credential in the file
   * @param workspace - the workspace we are working on
   * @param session - the current sessin we use to retrieve information from
   */
  private async awsCredentialProcess(workspace: Workspace, session) {
    const credentials = await this.getIamUserAccessKeysFromKeychain(session);

    this.getSessionToken(credentials).subscribe((awsCredentials) => {
        const tempCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(awsCredentials, workspace, session.account.region);

        workspace.ssmCredentials = tempCredentials;
        this.configurationService.updateWorkspaceSync(workspace);

        this.fileService.iniWriteSync(this.appService.awsCredentialPath(), tempCredentials);
        this.configurationService.disableLoadingWhenReady(workspace, session);
      },
      (err) => {
        this.appService.logger('Error in Aws Credential process', LoggerLevel.ERROR, this, err.stack);
        throw new Error(err);
    });
  }

  // TODO: move to AwsCredentialsGenerationService
  private getSessionToken(awsCredentials: AwsCredentials): Observable<any> {
    return new Observable<AwsCredentials>((observable) => {
      AWS.config.update({
        accessKeyId: awsCredentials.default.aws_access_key_id,
        secretAccessKey: awsCredentials.default.aws_secret_access_key
      });

      const sts = new AWS.STS();

      sts.getSessionToken({ DurationSeconds: environment.sessionDuration }, (err, data) => {
        console.log('err', err);
        console.log('cred', data);

        if (data !== undefined || data !== null) {
          observable.next(data);
          observable.complete();
        } else {
          this.appService.logger('Error in get session token', LoggerLevel.ERROR, this, err.stack);
          observable.error(err);
          observable.complete();
        }
      });
    });
  }

  // TODO: move to KeychainService
  private async getIamUserAccessKeysFromKeychain(session) {
    const accessKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(session.account.accountName, (session.account as AwsPlainAccount).user));
    const secretKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(session.account.accountName, (session.account as AwsPlainAccount).user));
    const credentials = {default: {aws_access_key_id: accessKey, aws_secret_access_key: secretKey}};
    return credentials;
  }

  awsCredentialFederatedProcess(workspace, session) {
    // Check for Aws Credentials Process
    if (!workspace) {
      return 'workspace not set';
    }
    const idpUrl = workspace.idpUrl ;

    // Enable current active session
    this.fileService.writeFileSync(this.appService.awsCredentialPath(), '');
    try {
      if (this.checkIfFederatedOrTrusterWithSamlFederation(session)) {
        this.workspaceService.refreshCredentials(idpUrl, session);
      } else {
        this.doubleJumpFromFixedCredential(session);
      }
    } catch (e) {
      this.appService.logger('Error in Aws Credential Federated Process', LoggerLevel.ERROR, this, e.stack);
      this.credentialsService.refreshReturnStatusEmit.emit(false);
    }

    // Start Calculating time here once credentials are actually retrieved
    this.timerService.defineTimer();
  }

  private checkIfFederatedOrTrusterWithSamlFederation(session) {
    if (session.account.parent === null || session.account.parent === undefined) {
      return true;
    } else if (session.account.parent !== null && session.account.parent !== undefined) {
      // Here we have a truster account now we need to know the nature of the truster account
      const parentAccountSessionId = session.account.parent;
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      const sessions = workspace.sessions;
      const parentAccountList = sessions.filter(sess => sess.id === parentAccountSessionId);

      if (parentAccountList.length > 0) {
        // Parent account found: check its nature
        return parentAccountList[0].account.type === AccountType.AWS;
      }
    }

    return true;
  }

  private async doubleJumpFromFixedCredential(session) {
    const parentAccountSessionId = session.account.parent;
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.sessions;
    const parentSessions = sessions.filter(sess => sess.id === parentAccountSessionId);

    console.log('parent sessions length:', parentSessions.length);

    if (parentSessions.length > 0) {
      // Parent account found: do double jump
      const parentSession = parentSessions[0];

      // First jump
      const accessKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(parentSession.account.accountName, (parentSession.account as AwsPlainAccount).user));
      const secretKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(parentSession.account.accountName, (parentSession.account as AwsPlainAccount).user));
      const credentials = {default: {aws_access_key_id: accessKey, aws_secret_access_key: secretKey}};

      // Update AWS sdk with new credentials
      AWS.config.update({
        accessKeyId: credentials.default.aws_access_key_id,
        secretAccessKey: credentials.default.aws_secret_access_key
      });

      // Second jump
      const sts = new AWS.STS();

      sts.assumeRole({
        RoleArn: `arn:aws:iam::${session.account.accountNumber}:role/${session.account.role.name}`,
        RoleSessionName: `truster-on-${session.account.role.name}`
      }, (err, data: any) => {
        if (err) {
          // Something went wrong save it to the logger file
          this.appService.logger('Error in assume role from plain to truster in get session token', LoggerLevel.ERROR, this, err.stack);
          this.appService.toast('There was a problem assuming role, please retry', ToastLevel.WARN);

          // Emit ko for double jump
          this.workspaceService.credentialEmit.emit({status: err.stack, accountName: session.account.accountName});

          // Finished double jump
          this.configurationService.disableLoadingWhenReady(workspace, session);
        } else {
          // we set the new credentials after the first jump
          const trusterCredentials: AwsCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.region);

          this.fileService.iniWriteSync(this.appService.awsCredentialPath(), trusterCredentials);

          this.configurationService.updateWorkspaceSync(workspace);
          this.configurationService.disableLoadingWhenReady(workspace, session);

          // Emit ok for double jump
          this.workspaceService.credentialEmit.emit({status: 'ok', accountName: session.account.accountName});

          // Finished double jump
          this.configurationService.disableLoadingWhenReady(workspace, session);

          this.appService.logger('Made it through Double jump from plain', LoggerLevel.INFO, this);
        }
      });
    }
  }
}
