import {AccountType} from '../models/AccountType';
import {AppService, ToastLevel} from '../services-system/app.service';
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
  awsStrategy;

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private keychainService: KeychainService,
    private proxyService: ProxyService,
    private timerService: TimerService,
    private workspaceService: WorkspaceService,
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
    this.awsStrategy = new AwsStrategy(this, appService, configurationService, executeService,
      fileService, keychainService, proxyService, timerService, workspaceService);

    this.strategyMap[AccountType.AWS] = this.awsStrategy.refreshCredentials.bind(this.awsStrategy);
    this.strategyMap[AccountType.AWS_PLAIN_USER] = this.awsStrategy.refreshCredentials.bind(this.awsStrategy);
    this.strategyMap[AccountType.AZURE] = this.azureStrategy.refreshCredentials.bind(this.azureStrategy);
  }

  refreshCredentials(accountType) {
    // Get all the info we need
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    if (accountType !== null) {
      this.strategyMap[accountType](workspace, accountType);
    } else {
      this.awsStrategy.refreshCredentials(workspace, accountType);
      this.azureStrategy.refreshCredentials(workspace, accountType);
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
      this.refreshReturnStatusEmit.emit(false);
    }
  }
}
