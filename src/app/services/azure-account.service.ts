import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {AzureAccount} from '../models/azure-account';
import {Session} from '../models/session';
import {v4 as uuidv4} from 'uuid';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {AccountType} from '../models/AccountType';

@Injectable({
  providedIn: 'root'
})
export class AzureAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService
  ) {
    super();
  }

  /**
   * Add a new Azure Account to workspace
   * @param subscriptionId - the account number
   * @param accountName - the account name
   */
  addAzureAccountToWorkSpace(subscriptionId: string, tenantId: string, accountName: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // Verify it not exists
    const test = workspace.sessions.filter(sess => (sess.account as AzureAccount).subscriptionId === subscriptionId);
    if (!test || test.length === 0) {
      // add new account
      const account: AzureAccount = {
        region,
        accountId: subscriptionId,
        accountName,
        subscriptionId,
        tenantId,
        type: AccountType.AZURE
      };

      const session: Session = {
        id: uuidv4(),
        active: false,
        loading: false,
        lastStopDate: new Date().toISOString(),
        account
      };

      // Once prepared the session object we verify if we can add it or not to the list and return a boolean about the operation
      workspace.sessions.push(session);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      this.appService.toast('Subscription Must be unique.', ToastLevel.WARN, 'Create Account');
      return false;
    }
  }

  /**
   * List all Azure account in the workspace
   */
  listAzureAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace && workspace.sessions && workspace.sessions.length > 0) {
      return workspace.sessions.filter(sess => (sess.account.parent === undefined && sess.account.awsRoles === undefined && sess.account.type === AccountType.AZURE));
    } else {
      return [];
    }
  }

  /**
   * Get A federated account given the account number
   * @param subscriptionId - the account subscriptionId to filter the account
   */
  getAzureAccountInWorkSpace(subscriptionId: string) {
    try {
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      return workspace.sessions.filter(sess => ((sess.account as AzureAccount).subscriptionId === subscriptionId))[0] as AzureAccount;
    } catch (err) {
      this.appService.logger(err, LoggerLevel.ERROR, this, err.stack);
      return null;
    }
  }

  /**
   * Delete a azure account
   * @param subscriptionId - account subscriptionId of the account to delete
   */
  deleteAzureAccount(subscriptionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.sessions;
    const index = sessions.indexOf(sess => ((sess.account as AzureAccount).subscriptionId === subscriptionId));
    if (index !== -1) {
      sessions.splice(index, 1);
      workspace.sessions = sessions;
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }
}
