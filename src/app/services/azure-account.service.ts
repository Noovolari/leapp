import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {AzureAccount} from '../models/azure-account';
import {SessionService} from './session.service';

@Injectable({
  providedIn: 'root'
})
export class AzureAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService,
    private sessionService: SessionService
  ) {
    super();
  }

  /**
   * Add a new Azure Account to workspace
   * @param subscriptionId - the account number
   * @param accountName - the account name
   */
  addAzureAccountToWorkSpace(subscriptionId: string, accountName: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // Verify it not exists
    const test = workspace.sessions.filter(sess => (sess.account as AzureAccount).subscriptionId === subscriptionId);
    if (!test || test.length === 0) {
      // add new account
      this.sessionService.addSession({
        accountId: subscriptionId,
        accountName,
        subscriptionId,
        type: 'AZURE'
      } as AzureAccount, false);
      return true;
    } else {
      return false;
    }
  }

  /**
   * List all Azure account in the workspace
   */
  listAzureAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace && workspace.sessions && workspace.sessions.length > 0) {
      return workspace.sessions.filter(sess => (sess.account.parent === undefined && sess.account.awsRoles === undefined && sess.account.type === 'AZURE'));
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
