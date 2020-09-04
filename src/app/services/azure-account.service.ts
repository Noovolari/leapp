import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {AzureAccount} from '../models/azure-account';

@Injectable({
  providedIn: 'root'
})
export class AzureAccountService extends NativeService {

  constructor(private configurationService: ConfigurationService) {
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
    const test = workspace.accountRoleMapping.accounts.filter(a => (a as AzureAccount).subscriptionId === subscriptionId);
    if (!test || test.length === 0) {
      // add new account
      workspace.accountRoleMapping.accounts.push({
        accountId: subscriptionId,
        accountName,
        subscriptionId,
        idpUrl: configuration.federationUrl,
        type: 'AZURE'
      });

      // Save the workspace
      this.configurationService.updateWorkspaceSync(workspace);
      // Set it as default
      this.configurationService.setDefaultWorkspaceSync(workspace.name);
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
    if (workspace && workspace.accountRoleMapping) {
      return workspace.accountRoleMapping.accounts.filter(ele => (ele.parent === undefined && ele.awsRoles[0].parent === undefined && ele.type === 'AZURE'));
    } else {
      return [];
    }
  }

  /**
   * Get A federated account given the account number
   * @param subscriptionId - the account subscriptionId to filter the account
   */
  getAzureAccountInWorkSpace(subscriptionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => ((ele as AzureAccount).subscriptionId === subscriptionId))[0] as AzureAccount;
  }

  /**
   * Delete a azure account
   * @param subscriptionId - account subscriptionId of the account to delete
   */
  deleteAzureAccount(subscriptionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => ((acc as AzureAccount).subscriptionId === subscriptionId));
    if (index !== -1) {
      workspace.accountRoleMapping.accounts.splice(index, 1);

      // delete sessions active session
      let sessionIndex = workspace.currentSessionList.indexOf(session => (session.accountData.subscriptionId !== subscriptionId));
      while (sessionIndex !== -1) {
        workspace.currentSessionList.splice(sessionIndex, 1);
        sessionIndex = workspace.currentSessionList.indexOf(session => (session.accountData.subscriptionId !== subscriptionId));
      }
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }

  }

  /**
   * Update a azure account
   * @param account - the account to be updated
   */
  updateAzureAccount(account: AzureAccount) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => ((acc as AzureAccount).accountId === account.accountId));
    if (index !== -1) {
      workspace.accountRoleMapping.accounts[index] = account;

      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

}
