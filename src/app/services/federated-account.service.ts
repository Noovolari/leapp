import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {TrusterAccountService} from './truster-account.service';

@Injectable({
  providedIn: 'root'
})
export class FederatedAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService,
    private trusterAccountService: TrusterAccountService) {
    super();
  }

  addFederatedAccountToWorkSpace(accountNumber: number, accountName: string, awsRoles: any[], idpArn: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

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

  listFederatedAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => (ele.parent === undefined && ele.awsRoles[0].parent === undefined));
  }

  getFederatedAccountInWorkSpace(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => (ele.accountNumber === accountNumber))[0];
  }

  deleteFederatedAccount(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountNumber === accountNumber));
    if (index !== -1) {
      workspace.accountRoleMapping.accounts.splice(index, 1);

      // cascade delete on truster accounts
      let accountIndex = workspace.accountRoleMapping.accounts.findIndex(account => (account.awsRoles.findIndex(role => (role.parent === accountNumber)) !== -1));
      while (accountIndex !== -1) {
        workspace.accountRoleMapping.accounts.splice(accountIndex, 1);
        accountIndex = workspace.accountRoleMapping.accounts.findIndex(account => (account.awsRoles.findIndex(role => (role.parent === accountNumber)) !== -1));
      }

      // delete sessions active session
      workspace.currentSessionList = workspace.currentSessionList.filter(session => (session.accountData.accountNumber.toString() !== accountNumber.toString()));
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }

  }

  updateFederatedAccount(account: AwsAccount) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountNumber === account.accountNumber));
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
