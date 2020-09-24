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

  private async awsCredentialProcess(workspace: Workspace, session) {
    const accessKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(session.account.accountName, (session.account as AwsPlainAccount).user));
    const secretKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(session.account.accountName, (session.account as AwsPlainAccount).user));
    const credentials = {default: {aws_access_key_id: accessKey, aws_secret_access_key: secretKey}};

    this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentials);
    this.configurationService.disableLoadingWhenReady(workspace, session);
  }

  awsCredentialFederatedProcess(workspace, session) {
    // Check for Aws Credentials Process
    if (!workspace.idpUrl) {
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
      this.appService.logger(e, LoggerLevel.ERROR);
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
      const parentAccountNumber = session.account.parent;
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      const sessions = workspace.sessions;
      const parentAccountList = sessions.filter(sess => sess.account.accountNumber === parentAccountNumber);

      if (parentAccountList.length > 0) {
        // Parent account found: check its nature
        return parentAccountList[0].account.type === AccountType.AWS;
      }
    }

    return true;
  }

  private async doubleJumpFromFixedCredential(session) {
    const parentAccountNumber = session.account.parent;
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.sessions;
    const parentAccountList = sessions.filter(sess => sess.account.accountNumber === parentAccountNumber);

    if (parentAccountList.length > 0) {
      // Parent account found: do double jump
      const parentSession = parentAccountList[0];

      // First jump
      const accessKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(parentSession.account.accountName, (parentSession.account as AwsPlainAccount).user));
      const secretKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(parentSession.account.accountName, (parentSession.account as AwsPlainAccount).user));
      const credentials = {default: {aws_access_key_id: accessKey, aws_secret_access_key: secretKey}};

      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentials);

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
          this.appService.logger(err.stack, LoggerLevel.ERROR);
          this.appService.toast('There was a problem assuming role, please retry', ToastLevel.WARN);

          // Emit ko for double jump
          this.workspaceService.credentialEmit.emit({status: err.stack, accountName: session.account.accountName});

          // Finished double jump
          this.configurationService.disableLoadingWhenReady(workspace, session);
        } else {
          // we set the new credentials after the first jump
          const trusterCredentials: AwsCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.accountNumber);

          this.fileService.iniWriteSync(this.appService.awsCredentialPath(), trusterCredentials);

          this.configurationService.updateWorkspaceSync(workspace);
          this.configurationService.disableLoadingWhenReady(workspace, session);

          // Emit ok for double jump
          this.workspaceService.credentialEmit.emit({status: 'ok', accountName: session.account.accountName});

          // Finished double jump
          this.configurationService.disableLoadingWhenReady(workspace, session);
        }
      });
    }
  }
}
