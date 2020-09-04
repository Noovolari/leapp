import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {TrusterAccountService} from './truster-account.service';

@Injectable({
  providedIn: 'root'
})
export class FederatedAccountService extends NativeService {

  constructor(private configurationService: ConfigurationService) {
    super();
  }

  /**
   * Add a new Federated Account to workspace
   * @param accountNumber - the account number
   * @param accountName - the account name
   * @param awsRoles - the list of roles [] to add to the account
   * @param idpArn - the idp arn as it is federated
   * @param region - the default region to use when selected for credentials
   */
  addFederatedAccountToWorkSpace(accountNumber: number, accountName: string, awsRoles: any[], idpArn: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    console.log('workspace:', workspace);

    const configuration = this.configurationService.getConfigurationFileSync();

    // Verify it not exists
    const test = workspace.accountRoleMapping.accounts.filter(a => (a as AwsAccount).accountNumber === accountNumber.toString());

    console.log('test', test);

    if (!test || test.length === 0) {
      // add new account
      workspace.accountRoleMapping.accounts.push({
        accountId: accountNumber,
        accountName,
        accountNumber,
        awsRoles,
        idpArn,
        idpUrl: configuration.federationUrl,
        region,
        type: 'AWS'
      });

      // Save the workspace
      this.configurationService.updateWorkspaceSync(workspace);
      // Set it as default
      this.configurationService.setDefaultWorkspaceSync(workspace.name);

      console.log('config', this.configurationService.getConfigurationFileSync());
      return true;
    } else {
      return false;
    }
  }

  /**
   * List all federated account in the workspace
   */
  listFederatedAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace && workspace.accountRoleMapping) {
      return workspace.accountRoleMapping.accounts.filter(ele => (ele.parent === undefined && ele.awsRoles[0].parent === undefined));
    } else {
      return [];
    }
  }

  /**
   * Get A federated account given the account number
   * @param accountNumber - the account number to filter the account
   */
  getFederatedAccountInWorkSpace(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => (ele.accountNumber === accountNumber))[0];
  }

  /**
   * Delete a federated account
   * @param accountNumber - account number of the account to delete
   */
  deleteFederatedAccount(accountNumber: string, roleName: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountNumber === accountNumber && acc.awsRoles.find((val) => val.name === roleName)));
    if (index !== -1) {
      workspace.accountRoleMapping.accounts.splice(index, 1);

      // cascade delete on truster accounts
      let accountIndex = workspace.accountRoleMapping.accounts.findIndex(account => (account.awsRoles.findIndex(role => (role.parent === accountNumber && role.parentRole === roleName)) !== -1));
      while (accountIndex !== -1) {
        workspace.accountRoleMapping.accounts.splice(accountIndex, 1);
        accountIndex = workspace.accountRoleMapping.accounts.findIndex(account => (account.awsRoles.findIndex(role => (role.parent === accountNumber && role.parentRole === roleName)) !== -1));
      }

      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }

  }

  /**
   * Update a federated account
   * @param account - the account to be updated
   */
  updateFederatedAccount(account: AwsAccount) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountId === account.accountId));
    if (index !== -1) {
      workspace.accountRoleMapping.accounts[index] = account;

      // remove unused roles from session
      let sessionIndex = workspace.currentSessionList.findIndex(session => (session.accountData.accountNumber === account.accountNumber && (account.awsRoles.findIndex(role => (role.name === session.roleData.name)) === -1)));
      while (sessionIndex !== -1) {
        workspace.currentSessionList.splice(sessionIndex, 1);
        sessionIndex = workspace.currentSessionList.findIndex(session => (session.accountData.accountNumber === account.accountNumber && (account.awsRoles.findIndex(role => (role.name === session.roleData.name)) === -1)));
      }

      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

}
