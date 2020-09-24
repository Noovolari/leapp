import {Strategy} from '../strategy';
import {AccountType} from '../AccountType';
import {Workspace} from '../workspace';
import {Session} from '../session';
import {ConfigurationService} from '../../services-system/configuration.service';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {AzureAccount} from '../azure-account';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {TimerService} from '../../services/timer-service';
import {CredentialsService} from '../../services/credentials.service';

export class AzureStrategy extends Strategy {

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

    console.log('active azure sessions', activeSessions);

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
          console.log('Error in command by Azure CLi', err);
        });
      }
    } else {
      // First time playing with Azure credentials
      this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(res => {

        this.azureSetSubscription(session);
      }, err => {
        console.log('Error in command by Azure CLi', err);
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
      this.appService.toast('Credentials refreshed.', ToastLevel.INFO, 'Credentials');
      this.credentialsService.refreshReturnStatusEmit.emit(true);
    }, err2 => {
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
