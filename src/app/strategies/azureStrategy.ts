import {RefreshCredentialsStrategy} from './refreshCredentialsStrategy';
import {AccountType} from '../models/AccountType';
import {Workspace} from '../models/workspace';
import {Session} from '../models/session';
import {ConfigurationService} from '../services-system/configuration.service';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {AzureAccount} from '../models/azure-account';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {TimerService} from '../services/timer-service';
import {CredentialsService} from '../services/credentials.service';

export class AzureStrategy extends RefreshCredentialsStrategy {

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private timerService: TimerService,
    private executeService: ExecuteServiceService,
    private configurationService: ConfigurationService) {
    super();
  }

  getActiveSessions(workspace: Workspace) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return sess.account.type === AccountType.AZURE && sess.active;
    });

    this.appService.logger('active azure sessions', LoggerLevel.INFO, this, JSON.stringify(activeSessions, null, 3));
    return activeSessions;
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      // Clean Azure Credential file
      this.cleanAzureCredentialFile();
    }
  }

  manageSingleSession(workspace, session) {
    if (workspace.azureConfig !== null && workspace.azureConfig !== undefined) {
      // Already have tokens
      // 1) Write accessToken e profile again
      this.configurationService.updateAzureProfileFileSync(workspace.azureProfile);
      this.configurationService.updateAzureAccessTokenFileSync(workspace.azureConfig);

      const parsedAzureProfile = JSON.parse(workspace.azureProfile.substr(1));
      let tenantFound = false;

      parsedAzureProfile.subscriptions.forEach((subscription) => {
        if (subscription.tenantId === (session.account as AzureAccount).tenantId) {
          tenantFound = true;
        }
      });

      if (tenantFound) {
        // 2a) Apply set subscription
        this.azureSetSubscription(session);
      } else {
        // 2b) First time playing with Azure credentials
        this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(res => {

          this.azureSetSubscription(session);
        }, err => {
          this.appService.logger('Error in command by Azure Cli', LoggerLevel.ERROR, this, err.stack);
          console.log('Error in command by Azure CLI', err);
        });
      }
    } else {
      // First time playing with Azure credentials
      this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(res => {

        this.azureSetSubscription(session);
      }, err => {
        this.appService.logger('Error in command by Azure Cli', LoggerLevel.ERROR, this, err.stack);
        console.log('Error in command by Azure CLI', err);
      });
    }
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

  private azureSetSubscription(session: Session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    // We can use Json in res to save account information
    this.executeService.execute(`az account set --subscription ${(session.account as AzureAccount).subscriptionId} 2>&1`).subscribe(acc => {
      // be sure to save the profile and tokens
      workspace.azureProfile = this.configurationService.getAzureProfileSync();
      workspace.azureConfig = this.configurationService.getAzureConfigSync();
      this.configurationService.updateWorkspaceSync(workspace);
      this.configurationService.disableLoadingWhenReady(workspace, session);

      // Start Calculating time here once credentials are actually retrieved
      this.timerService.defineTimer();

      // Emit return credentials
      this.credentialsService.refreshReturnStatusEmit.emit(true);
    }, err2 => {
      this.appService.logger('Error in command: set subscription by Azure Cli', LoggerLevel.ERROR, this, err2.stack);

      workspace.sessions.forEach(sess => {
        if (sess.id === session.id) {
          sess.active = false;
          sess.loading = false;
          sess.lastStopDate = new Date().toISOString();
        }
      });

      this.configurationService.updateWorkspaceSync(workspace);
      this.credentialsService.refreshReturnStatusEmit.emit(false);
      this.appService.redrawList.emit();
      this.appService.toast('Can\'t refresh Credentials.', ToastLevel.WARN, 'Credentials');
    });
  }
}
