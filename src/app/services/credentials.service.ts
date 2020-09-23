import {EventEmitter, Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {FileService} from '../services-system/file.service';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {environment} from '../../environments/environment';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {Session} from '../models/session';
import {AccountType} from '../models/AccountType';
import {AzureAccount} from '../models/azure-account';
import {MenuService} from './menu.service';
import {Workspace} from '../models/workspace';
import {KeychainService} from '../services-system/keychain.service';
import {AwsPlainAccount} from '../models/aws-plain-account';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService extends NativeService {

  // Emitters
  // public refreshCredentialsEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  public refreshCredentialsEmit: EventEmitter<AccountType> = new EventEmitter<AccountType>();
  public refreshReturnStatusEmit: EventEmitter<boolean> = new EventEmitter<boolean>();

  // Unique timer object and time data
  timer = null;
  startTime;

  constructor(
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private appService: AppService,
    private keychainService: KeychainService
  ) {

    super();

    this.refreshCredentialsEmit.subscribe((accountType) => this.refreshCredentials(accountType));
    this.workspaceService.credentialEmit.subscribe(res => this.processCredentials(res));
  }

  refreshCredentials(accountType) {
    // Get all the info we need
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    console.log('workspace in refreshCredentials', workspace);

    if (accountType !== null) {
      switch (accountType) {
        case AccountType.AWS: {
          this.refreshAwsCredentials(workspace, accountType);
          break;
        }
        case AccountType.AWS_PLAIN_USER: {
          this.refreshAwsCredentials(workspace, accountType);
          break;
        }
        case AccountType.AZURE: {
          this.refreshAzureCredentials(workspace, accountType);
          break;
        }
      }
    } else {
      this.refreshAwsCredentials(workspace, accountType);
      this.refreshAzureCredentials(workspace, accountType);
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
      for (let i = 0; i < activeSessions.length; i++) {
        const sess = activeSessions[i];
        if (sess.account.type === AccountType.AWS_PLAIN_USER) {
          this.awsCredentialProcess(workspace, sess);
        } else if (sess.account.type === AccountType.AWS) {
          this.awsCredentialFederatedProcess(workspace, sess);
        }
      }
    } else {
      this.cleanAwsCredential(workspace);
    }
  }

  private refreshAzureCredentials(workspace, accountType) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return sess.account.type === AccountType.AZURE && sess.active;
    });

    // Check if all the session are as expected
    console.log('active azure sessions', activeSessions);

    // Refresh all active sessions credentials
    if (activeSessions.length > 0) {
      activeSessions.forEach(sess => {
        this.azureCredentialProcess(workspace, sess);
      });
    } else {
      this.cleanAzureCredential(workspace);
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
      this.workspaceService.refreshCredentials(idpUrl, session);
    } catch (e) {
      this.appService.logger(e, LoggerLevel.ERROR);
      this.refreshReturnStatusEmit.emit(false);
    }

    // Start Calculating time here once credentials are actually retrieved
    this.startTime = new Date();

    // If the timer is not set, set the unique timer object and fix the starting time
    if (this.timer === undefined || this.timer === null) {
      this.timer = setInterval(() => {
        // process time check for session
        this.processRefreshCredentials();
      }, 1000);
    }
  }

  azureCredentialProcess(workspace, session) {
    if (workspace.azureConfig !== null && workspace.azureConfig !== undefined) {
      // Already have tokens
      // 1) Write accessToken e profile again
      this.configurationService.updateAzureProfileFileSync(workspace.azureProfile);
      this.configurationService.updateAzureAccessTokenFileSync(workspace.azureConfig);

      const parsedAzureProfile = JSON.parse(workspace.azureProfile.substr(1));

      console.log(session);
      console.log(parsedAzureProfile);

      let tenantFound = false;

      parsedAzureProfile.subscriptions.forEach((subscription) => {
        if (subscription.tenantId === session.account.tenantId) {
          tenantFound = true;
        }
      });

      if (tenantFound) {
        // 2a) Apply set subscription
        this.azureSetSubscription(session);
      } else {
        // 2b) First time playing with Azure credentials
        this.executeService.execute(`az login --tenant ${session.account.tenantId} 2>&1`).subscribe(res => {

          this.azureSetSubscription(session);
        }, err => {
          console.log('Error in command by Azure CLi', err);
        });
      }
    } else {
      // First time playing with Azure credentials
      this.executeService.execute(`az login --tenant ${session.account.tenantId} 2>&1`).subscribe(res => {

        this.azureSetSubscription(session);
      }, err => {
        console.log('Error in command by Azure CLi', err);
      });
    }
  }

  // ===================================================================================================================

  cleanAwsCredential(workspace) {
    if (workspace) {
      // if there are not active sessions stop session.
      workspace.principalAccountNumber = null;
      workspace.principalRoleName = null;

      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), {});
      this.configurationService.updateWorkspaceSync(workspace);

      // Stop the current timer and start date
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        this.startTime = null;
      }
    }
  }

  cleanAzureCredential(workspace) {
    if (workspace) {
      // if there are not active sessions stop session.
      console.log('inside cleanCred - azure');
      // Clean Azure Credential file
      this.cleanAzureCredentialFile();

      // Stop the current timer and start date
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        this.startTime = null;
      }
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

  /**
   * Process the actual refresh credential check: if we are over the sessionDuration parameters we need to refresh credentials
   */
  private processRefreshCredentials() {
    if (this.startTime) {
      const currentTime = new Date();
      const seconds = (currentTime.getTime() - this.startTime.getTime()) / 1000;
      const timeToRefresh = (seconds > environment.sessionDuration);
      if (timeToRefresh) {
        this.refreshCredentials(null);
      }
    }
  }

  azureSetSubscription(session: Session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    // We can use Json in res to save account information
    this.executeService.execute(`az account set --subscription ${(session.account as AzureAccount).subscriptionId} 2>&1`).subscribe(acc => {
      // be sure to save the profile and tokens
      workspace.azureProfile = this.configurationService.getAzureProfileSync();
      workspace.azureConfig = this.configurationService.getAzureConfigSync();
      this.configurationService.updateWorkspaceSync(workspace);
      this.configurationService.disableLoadingWhenReady(workspace, session);

      // Start Calculating time here once credentials are actually retrieved
      this.startTime = new Date();

      // If the timer is not set, set the unique timer object and fix the starting time
      if (this.timer === undefined || this.timer === null) {
        this.timer = setInterval(() => {
          // process time check for session
          this.processRefreshCredentials();
        }, 1000);
      }

      // Emit return credentials
      this.appService.toast('Credentials refreshed.', ToastLevel.INFO, 'Credentials');
      this.refreshReturnStatusEmit.emit(true);
    }, err2 => {
      workspace.sessions.forEach(sess => {
        if (sess.id === session.id) {
          sess.active = false;
          sess.loading = false;
          sess.lastStopDate = new Date().toISOString();
        }
      });
      this.configurationService.updateWorkspaceSync(workspace);
      this.refreshReturnStatusEmit.emit(false);
      this.appService.redrawList.emit();
      this.appService.toast('Can\'t refresh Credentials.', ToastLevel.WARN, 'Credentials');
    });
  }

  private cleanAzureCredentialFile() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace && this.configurationService.isAzureConfigPresent()) {
      workspace.azureProfile = this.configurationService.getAzureProfileSync();
      workspace.azureConfig = this.configurationService.getAzureConfigSync();
      if (workspace.azureConfig === '[]') {
        // Anomalous condition revert to normal az login procedure
        workspace.azureProfile = null;
        workspace.azureConfig = null;
      }

      this.configurationService.updateWorkspaceSync(workspace);
    }
    this.executeService.execute('az account clear 2>&1').subscribe(res => {}, err => {});
  }

}
