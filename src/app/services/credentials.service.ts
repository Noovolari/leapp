import {AccountType} from '../models/AccountType';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {AwsStrategy} from '../strategies/awsStrategy';
import {AzureStrategy} from '../strategies/azureStrategy';
import {ConfigurationService} from '../services-system/configuration.service';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {Injectable} from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class CredentialsService extends NativeService {

  // Global strategy map
  strategyMap = {};

  // Strategies
  azureStrategy;
  awsStrategy;
  awsSsoStrategy;

  refreshStrategySubcribeAll;

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

    // =================================================
    // Subscribe to global timer manager from strategies
    // =================================================
    this.timerService.processRefreshByTimer.subscribe(() => this.refreshCredentials());

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

  refreshCredentials() {
    // Get all the info we need
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    if (!this.refreshStrategySubcribeAll) {
      this.refreshStrategySubcribeAll = true;
      concat(
        this.awsStrategy.refreshCredentials(workspace),
        this.azureStrategy.refreshCredentials(workspace),
        this.awsSsoStrategy.refreshCredentials(workspace)
      ).subscribe(
        () => {
          this.appService.redrawList.emit(true);
          this.refreshStrategySubcribeAll = false;
        },
        e => {
          this.appService.logger('Error in Aws Credential Process', LoggerLevel.ERROR, this, e.stack);
          this.appService.toast('Error in Aws Credential Process: ' + e.toString(), ToastLevel.WARN, 'Aws Credential Process');
          this.refreshStrategySubcribeAll = false;
      });
    }

    if (this.timerService.needToClearTimer()) {
      this.timerService.clearTimer();
    }
  }
}
