import {EventEmitter, Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {FileService} from '../services-system/file.service';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {environment} from '../../environments/environment';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {AccountType} from '../models/AccountType';
import {Workspace} from '../models/workspace';
import {KeychainService} from '../services-system/keychain.service';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {AwsCredentials} from '../models/credential';
import {TimerService} from './timer-service';
import {AzureStrategy} from '../models/strategies/azureStrategy';

// Import AWS node style
const AWS = require('aws-sdk');

@Injectable({
  providedIn: 'root'
})
export class CredentialsService extends NativeService {

  // Emitters
  public refreshCredentialsEmit: EventEmitter<AccountType> = new EventEmitter<AccountType>();
  public refreshReturnStatusEmit: EventEmitter<boolean> = new EventEmitter<boolean>();

  // Global strategy map
  strategyMap = {};

  // Strategies
  azureStrategy;

  constructor(
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private appService: AppService,
    private keychainService: KeychainService,
    private timerService: TimerService
  ) {

    super();

    this.refreshCredentialsEmit.subscribe((accountType) => this.refreshCredentials(accountType));
    this.workspaceService.credentialEmit.subscribe(res => this.processCredentials(res));

    // =================================================
    // Subscribe to global timer manager from strategies
    // =================================================
    this.timerService.processRefreshByTimer.subscribe(() => {
      this.refreshCredentials(null);
    });

    // ==============================
    // Define the global strategy map
    // ==============================
    // test using Strategy instead of direct methods
    this.azureStrategy = new AzureStrategy(this, appService, timerService, executeService, configurationService);

    this.strategyMap[AccountType.AWS] = this.refreshAwsCredentials.bind(this);
    this.strategyMap[AccountType.AWS_PLAIN_USER] = this.refreshAwsCredentials.bind(this);
    this.strategyMap[AccountType.AZURE] = this.azureStrategy.refreshCredentials.bind(this.azureStrategy);
  }

  refreshCredentials(accountType) {
    // Get all the info we need
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    console.log('workspace in refreshCredentials', workspace);

    if (accountType !== null) {
      this.strategyMap[accountType](workspace, accountType);
    } else {
      this.refreshAwsCredentials(workspace, accountType);
      this.azureStrategy.refreshCredentials(workspace, accountType);
    }
  }

  // ===================================================================================================================

  private refreshAwsCredentials(workspace, accountType) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_PLAIN_USER || sess.account.type === AccountType.AWS) && sess.active;
    });

    // Check if all the session are as expected
    console.log('active aws sessions', activeSessions);

    // Refresh all active sessions credentials
    if (activeSessions.length > 0) {
      activeSessions.forEach(sess => {
        if (sess.account.type === AccountType.AWS_PLAIN_USER) {
          this.awsCredentialProcess(workspace, sess);
        } else if (sess.account.type === AccountType.AWS) {
          this.awsCredentialFederatedProcess(workspace, sess);
        }
      });
    } else {
      this.cleanAwsCredential(workspace);
    }
  }

  // ===================================================================================================================

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

    // enable current active session
    this.fileService.writeFileSync(this.appService.awsCredentialPath(), '');
    try {
      if (this.checkIfFederatedOrTrusterWithSamlFederation(session)) {
        this.workspaceService.refreshCredentials(idpUrl, session);
      } else {
        this.doubleJumpFromFixedCredential(session);
      }
    } catch (e) {
      this.appService.logger(e, LoggerLevel.ERROR);
      this.refreshReturnStatusEmit.emit(false);
    }

    // Start Calculating time here once credentials are actually retrieved
    this.timerService.defineTimer();
  }

  // ===================================================================================================================

  cleanAwsCredential(workspace) {
    if (workspace) {
      // if there are not active sessions stop session.
      workspace.principalAccountNumber = null;
      workspace.principalRoleName = null;

      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), {});
      this.configurationService.updateWorkspaceSync(workspace);

      // Clear timer
      this.timerService.clearTimer();
    }
  }

  // ===================================================================================================================

  /**
   * Method that is launched when credential are emitted by the workspace service
   * @param res - contain the status the operation
   */
  private processCredentials(res: any) {
    if (res.status === 'ok') {
      this.appService.toast('Credentials refreshed.', ToastLevel.INFO, 'Credentials');
      this.refreshReturnStatusEmit.emit(true);
    } else {
      this.appService.toast('There was a problem in generating credentials..', ToastLevel.WARN, 'Credentials');
      this.refreshReturnStatusEmit.emit(false);
    }
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
