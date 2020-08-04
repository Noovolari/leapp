import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class TrusterAccountService extends NativeService {

  constructor(private configurationService: ConfigurationService) {
    super();
  }

  /**
   * Add a truster account to the workspace
   * @param accountNumber - the account number of the truster account
   * @param accountName - the account name
   * @param awsRoles - the AWS roles to assign to the account
   * @param idpArn - the idArn used for the federatyed account
   * @param region - the default region to use
   */
  addTrusterAccountToWorkSpace(accountNumber: number, accountName: string, awsRoles: any[], idpArn: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // if the account doesn't exists
    const test = workspace.accountRoleMapping.accounts.filter(a => a.accountNumber === accountNumber);
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
      return true;
    } else {
      return false;
    }
  }

  /**
   * List the truster accounts in the parent account
   * @param parentAccountNumber - the parent account number
   */
  listTrusterAccountInWorkSpace(parentAccountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => ((ele.awsRoles[0].parent === parentAccountNumber)));
  }

  /**
   * Get the truster account in the workspace givent the account number
   * @param accountNumber - the account number used to retrieve the truster account
   */
  getTrusterAccountInWorkSpace(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => ((ele.accountNumber === accountNumber)))[0];
  }

  /**
   * Delete the truster account
   * @param accountNumber - the account number we use to delete the truster account
   */
  deleteTrusterAccount(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountNumber === accountNumber));
    // if there is an actual account with that number
    if (index !== -1) {
      workspace.accountRoleMapping.accounts.splice(index, 1);
      let sessionIndex = workspace.currentSessionList.indexOf(session => (session.accountData.accountNumber !== accountNumber));
      // Remove all the copies of the specified account as it may exists with different roles
      while (sessionIndex !== -1) {
        workspace.currentSessionList.splice(sessionIndex, 1);
        sessionIndex = workspace.currentSessionList.indexOf(session => (session.accountData.accountNumber !== accountNumber));
      }
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Update a Truster Account given the Aws Account
   * @param account - the aws account we want to update
   */
  updateTrusterAccount(account: AwsAccount) {
    // Get the default workspace
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    // Verify we have found the account we need
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountNumber === account.accountNumber));
    if (index !== -1) {

      workspace.accountRoleMapping.accounts[index] = account;
      // find session with non existing roles of this account
      let sessionTrusterIndex = workspace.currentSessionList.findIndex(session => (session.accountData.accountNumber === account.accountNumber && (account.awsRoles.findIndex(role => (role.name === session.roleData.name)) === -1)));
      while (sessionTrusterIndex !== -1) {
        workspace.currentSessionList.splice(sessionTrusterIndex, 1);
        sessionTrusterIndex = workspace.currentSessionList.findIndex(session => (session.accountData.accountNumber === account.accountNumber && (account.awsRoles.findIndex(role => (role.name === session.roleData.name)) === -1)));
      }
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }
}
