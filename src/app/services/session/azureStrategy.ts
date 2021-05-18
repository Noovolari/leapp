import {SessionType} from '../../models/session-type';
import {Workspace} from '../../models/workspace';
import {Session} from '../../models/session';
import {ConfigurationService} from '../configuration.service';
import {ExecuteServiceService} from '../execute-service.service';
import {AzureAccount} from '../../models/azure-account';
import {AppService, LoggerLevel, ToastLevel} from '../app.service';
import {Observable, Subscriber, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {FileService} from '../file.service';
import {SessionStatus} from '../../models/session-status';

export class AzureStrategy {
  private processSubscription: Subscription;
  private processSubscription2: Subscription;
  private processSubscription4: Subscription;

  constructor(
    private appService: AppService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private configurationService: ConfigurationService) {}

  getActiveSessions(workspace: Workspace) {
    const activeSessions = workspace.sessions.filter((sess) => sess.account.type === SessionType.azure && sess.status === SessionStatus.active);

    this.appService.logger('active azure sessions', LoggerLevel.info, this, JSON.stringify(activeSessions, null, 3));
    return activeSessions;
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      // Clean Azure Credential file
      this.cleanAzureCredentialFile();
    }
  }

  manageSingleSession(workspace, session): Observable<boolean> {
    return new Observable(observer => {
      if (workspace.azureConfig !== null && workspace.azureConfig !== undefined) {
        // Already have tokens


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
          if (this.processSubscription) {
 this.processSubscription.unsubscribe();
}
          this.processSubscription = this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(() => {
            this.azureSetSubscription(observer, session);
          }, err => {
            this.appService.logger('Error in command by Azure Cli', LoggerLevel.error, this, err.stack);
            console.log('Error in command by Azure CLI', err);
            observer.next(false);
            observer.complete();
          });
        }
      } else {
        // First time playing with Azure credentials
        if (this.processSubscription2) {
 this.processSubscription2.unsubscribe();
}
        this.processSubscription2 = this.executeService.execute(`az login --tenant ${(session.account as AzureAccount).tenantId} 2>&1`).subscribe(() => {
          this.azureSetSubscription(observer, session);
        }, err => {
          this.appService.logger('Error in command by Azure Cli', LoggerLevel.error, this, err.stack);
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
    // const workspace = this.workspaceService.get();
    // We can use Json in res to save account information
    if (this.processSubscription4) {
 this.processSubscription4.unsubscribe();
}
    this.processSubscription4 = this.executeService.execute(`az account set --subscription ${(session.account as AzureAccount).subscriptionId} 2>&1`).pipe(
      switchMap(() => this.executeService.execute(`az configure --default location=${session.account.region} 2>&1`))
    ).subscribe(() => {
      // be sure to save the profile and tokens
      // workspace.azureProfile = this.configurationService.getAzureProfileSync();
      // workspace.azureConfig = this.configurationService.getAzureConfigSync();
      // this.configurationService.updateWorkspaceSync(workspace);
      // this.configurationService.disableLoadingWhenReady(workspace, session);

      // Emit return credentials
      this.appService.refreshReturnStatusEmit.emit(true);
      observer.next(true);
      observer.complete();
    }, err2 => {
      this.appService.logger('Error in command: set subscription by Azure Cli', LoggerLevel.error, this, err2.stack);

      // this.sessionService.stop(session.sessionId);

      // this.workspaceService.update(workspace);
      this.appService.refreshReturnStatusEmit.emit(session);
      this.appService.toast('Can\'t refresh Credentials.', ToastLevel.warn, 'Credentials');
      observer.next(false);
      observer.complete();
    });
  }
}
