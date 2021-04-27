import {AccountType} from '../models/AccountType';
import {Workspace} from '../models/workspace';
import {Session} from '../models/session';
import {ConfigurationService} from '../services-system/configuration.service';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {AzureAccount} from '../models/azure-account';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {TimerService} from '../services/timer-service';
import {Observable, Subscriber, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {FileService} from '../services-system/file.service';

export class AzureStrategy extends RefreshCredentialsStrategy {
  private processSubscription: Subscription;
  private processSubscription2: Subscription;
  private processSubscription4: Subscription;

  constructor(
    private appService: AppService,
    private timerService: TimerService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
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
      this.timerService.noAzureSessionsActive = true;
    }
  }

  manageSingleSession(workspace, session): Observable<boolean> {
    return new Observable(observer => {
      if (workspace.azureConfig !== null && workspace.azureConfig !== undefined) {
        // Already have tokens

        if (this.timerService.noAzureSessionsActive === true) {
          this.timerService.noAzureSessionsActive = false;
        }

        // 1) Write accessToken and profile again
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
          this.azureSetSubscription(observer, session);
        } else {
          // 2b) First time playing with Azure credentials
          if (this.processSubscription) { this.processSubscription.unsubscribe(); }
          this.processSubscription = this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(() => {
            this.azureSetSubscription(observer, session);
          }, err => {
            this.appService.logger('Error in command by Azure Cli', LoggerLevel.ERROR, this, err.stack);
            console.log('Error in command by Azure CLI', err);
            observer.next(false);
            observer.complete();
          });
        }
      } else {
        // First time playing with Azure credentials
        if (this.processSubscription2) { this.processSubscription2.unsubscribe(); }
        this.processSubscription2 = this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(() => {
          this.azureSetSubscription(observer, session);
        }, err => {
          this.appService.logger('Error in command by Azure Cli', LoggerLevel.ERROR, this, err.stack);
          console.log('Error in command by Azure CLI', err);
          observer.next(false);
          observer.complete();
        });
      }
    });
  }

  private cleanAzureCredentialFile() {
    this.configurationService.cleanAzureCrendentialFile();
  }

  private azureSetSubscription(observer: Subscriber<boolean>, session: Session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    // We can use Json in res to save account information
    if (this.processSubscription4) { this.processSubscription4.unsubscribe(); }
    this.processSubscription4 = this.executeService.execute(`az account set --subscription ${(session.account as AzureAccount).subscriptionId} 2>&1`).pipe(
      switchMap(() => this.executeService.execute(`az configure --default location=${session.account.region} 2>&1`))
    ).subscribe(() => {
      // be sure to save the profile and tokens
      workspace.azureProfile = this.configurationService.getAzureProfileSync();
      workspace.azureConfig = this.configurationService.getAzureConfigSync();
      this.configurationService.updateWorkspaceSync(workspace);
      this.configurationService.disableLoadingWhenReady(workspace, session);

      // Start Calculating time here once credentials are actually retrieved
      this.timerService.defineTimer();

      // Emit return credentials
      this.appService.refreshReturnStatusEmit.emit(true);
      observer.next(true);
      observer.complete();
    }, err2 => {
      this.appService.logger('Error in command: set subscription by Azure Cli', LoggerLevel.ERROR, this, err2.stack);

      workspace.sessions.forEach(sess => {
        if (sess.id === session.id) {
          sess.active = false;
          sess.loading = false;
          sess.complete = false;
          sess.lastStopDate = new Date().toISOString();
        }
      });

      this.configurationService.updateWorkspaceSync(workspace);
      this.appService.refreshReturnStatusEmit.emit(session);
      this.appService.toast('Can\'t refresh Credentials.', ToastLevel.WARN, 'Credentials');
      observer.next(false);
      observer.complete();
    });
  }
}
