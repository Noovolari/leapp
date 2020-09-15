import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {SessionService} from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TrusterAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService,
    private sessionService: SessionService
  ) {
    super();
  }

  /**
   * Add a truster account to the workspace
   * @param accountNumber - the account number of the truster account
   * @param accountName - the account name
   * @param role - the AWS roles to assign to the account
   * @param idpArn - the idArn used for the federatyed account
   * @param region - the default region to use
   */
  addTrusterAccountToWorkSpace(accountNumber: number, accountName: string, parentName: string, parentRole: string, role: any, idpArn: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // if the account doesn't exists
    const test = workspace.sessions.filter(sess => sess.account.accountNumber === accountNumber && sess.account.role.name === role.name);
    if (!test || test.length === 0) {
      // add new account
      this.sessionService.addSession({
        accountId: accountNumber,
        accountName,
        accountNumber,
        role,
        idpArn,
        parent: parentName,
        parentRole,
        idpUrl: configuration.federationUrl,
        type: 'AWS'
      } as unknown as AwsAccount, false);
      // Save the workspace
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

  /**
   * List the truster accounts in the parent account
   */
  listTrusterAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.sessions.filter(ele => ((ele.account.parent !== undefined && ele.account.type === 'AWS')));
  }

  /**
   * Get the truster account in the workspace givent the account number
   * @param sessionId - the sessionId used to retrieve the truster account
   */
  getTrusterAccountInWorkSpace(sessionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.sessions.filter(ele => ((ele.id === sessionId)))[0];
  }

  /**
   * Delete the truster account
   * @param sessionId - the asession id we use to delete the truster account
   */
  deleteTrusterAccount(sessionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.sessions.findIndex(sess => sess.id === sessionId);
    // if there is an actual account with that number
    if (index !== -1) {
      workspace.sessions.splice(index, 1);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }
}
