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

  addTrusterAccountToWorkSpace(accountNumber: number, accountName: string, awsRoles: any[], idpArn: string, region: string) {
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

  listTrusterAccountInWorkSpace(parentAccountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => ((ele.awsRoles[0].parent === parentAccountNumber)));
  }

  getTrusterAccountInWorkSpace(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.accountRoleMapping.accounts.filter(ele => ((ele.accountNumber === accountNumber)))[0];
  }

  deleteTrusterAccount(accountNumber: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.accountRoleMapping.accounts.findIndex(acc => (acc.accountNumber.toString() === accountNumber.toString()));
    if (index !== -1) {
      workspace.accountRoleMapping.accounts.splice(index, 1);
      workspace.currentSessionList = workspace.currentSessionList.filter(session => (session.accountData.accountNumber.toString() !== accountNumber.toString()));
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

  updateTrusterAccount(account: AwsAccount) {
    console.log(account);
    const workspace = this.configurationService.getDefaultWorkspaceSync();
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
