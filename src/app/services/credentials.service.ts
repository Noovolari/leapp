import {AccountType} from '../models/AccountType';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {AwsStrategy} from '../strategies/awsStrategy';
import {AzureStrategy} from '../strategies/azureStrategy';
import {ConfigurationService} from '../services-system/configuration.service';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {EventEmitter, Injectable} from '@angular/core';
import {FileService} from '../services-system/file.service';
import {KeychainService} from '../services-system/keychain.service';
import {NativeService} from '../services-system/native-service';
import {ProxyService} from './proxy.service';
import {TimerService} from './timer-service';
import {WorkspaceService} from './workspace.service';
import {concat} from 'rxjs';
import {AwsSsoStrategy} from '../strategies/awsSsoStrategy';
import {AwsSsoService} from '../integrations/providers/aws-sso.service';
import {SessionService} from './session.service';
import {last} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService extends NativeService {

  // Emitters
  public refreshCredentialsEmit: EventEmitter<AccountType> = new EventEmitter<AccountType>();
  public refreshReturnStatusEmit: EventEmitter<any> = new EventEmitter<any>();

  // Global strategy map
  strategyMap = {};

  // Strategies
  azureStrategy;
  awsStrategy;
  awsSsoStrategy;

  refreshStrategySubcribeAll;
  refreshStrategySubscribeSingle = {};

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private keychainService: KeychainService,
    private proxyService: ProxyService,
    private timerService: TimerService,
    private workspaceService: WorkspaceService,
    private awsSsoService: AwsSsoService,
    private sessionService: SessionService
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
    this.azureStrategy = new AzureStrategy(this, appService, timerService, executeService, fileService, configurationService);
    this.awsStrategy = new AwsStrategy(this, appService, configurationService, executeService,
      fileService, keychainService, proxyService, timerService, workspaceService, sessionService, awsSsoService);
    this.awsSsoStrategy = new AwsSsoStrategy(this, appService, fileService, timerService, awsSsoService, configurationService, sessionService, keychainService);

    this.strategyMap[AccountType.AWS] = this.awsStrategy.refreshCredentials.bind(this.awsStrategy);
    this.strategyMap[AccountType.AWS_PLAIN_USER] = this.awsStrategy.refreshCredentials.bind(this.awsStrategy);
    this.strategyMap[AccountType.AZURE] = this.azureStrategy.refreshCredentials.bind(this.azureStrategy);
    this.strategyMap[AccountType.AWS_SSO] = this.awsSsoStrategy.refreshCredentials.bind(this.awsSsoStrategy);
  }

  refreshCredentials(accountType) {
    // Get all the info we need
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    if (accountType !== null) {
      this.strategyMap[accountType](workspace, accountType).pipe(last()).subscribe(
        () => this.appService.redrawList.emit(true),
        e => {
          this.appService.logger('Error in Aws Credential Process', LoggerLevel.ERROR, this, e.stack);
          this.appService.toast('Error in Aws Credential Process: ' + e.toString(), ToastLevel.WARN, 'Aws Credential Process');
      });
    } else {
      this.refreshStrategySubcribeAll = concat(
        this.awsSsoStrategy.refreshCredentials(workspace),
        this.awsStrategy.refreshCredentials(workspace),
        this.azureStrategy.refreshCredentials(workspace)
      ).pipe(last()).subscribe(
        () => this.appService.redrawList.emit(true),
          e => {
            this.appService.logger('Error in Aws Credential Process', LoggerLevel.ERROR, this, e.stack);
            this.appService.toast('Error in Aws Credential Process: ' + e.toString(), ToastLevel.WARN, 'Aws Credential Process');
      });
    }

    if (this.timerService.needToClearTimer()) {
      this.timerService.clearTimer();
    }
  }

  /**
   * Method that is launched when credential are emitted by the workspace service
   * @param res - contain the status the operation
   */
  private processCredentials(res: any) {
    if (res.status === 'ok') {
      this.refreshReturnStatusEmit.emit(true);
    } else {
      this.appService.toast('There was a problem in generating credentials.', ToastLevel.WARN, 'Credentials');
      this.refreshReturnStatusEmit.emit(res.session);
    }
  }
}
