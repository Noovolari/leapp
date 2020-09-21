import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {Session} from '../models/session';
import {v4 as uuidv4} from 'uuid';
import {AppService, ToastLevel} from '../services-system/app.service';
import {AccountType} from '../models/AccountType';

@Injectable({
  providedIn: 'root'
})
export class TrusterAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService
  ) {
    super();
  }

  /**
   * Add a truster account to the workspace
   * @param accountNumber - the account number of the truster account
   * @param accountName - the account name
   * @param role - the AWS roles to assign to the account
   * @param idpArn - the idArn used for the federated account
   */
  addTrusterAccountToWorkSpace(accountNumber: number, accountName: string, parentName: string, parentRole: string, role: any, idpArn: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // if the account doesn't exists
    const test = workspace.sessions.filter(sess => sess.account.accountNumber === accountNumber && sess.account.role && sess.account.role.name === role.name);
    if (!test || test.length === 0) {
      // add new account
      const account = {
        accountId: accountNumber,
        accountName,
        accountNumber,
        role,
        idpArn,
        parent: parentName,
        parentRole,
        idpUrl: configuration.federationUrl,
        type: AccountType.AWS
      };

      const session: Session = {
        id: uuidv4(),
        active: false,
        loading: false,
        lastStopDate: new Date().toISOString(),
        account
      };

      const alreadyExist = workspace.sessions.filter(s => (session.id === s.id)).length;
      // Once prepared the session object we verify if we can add it or not to the list and return a boolean about the operation
      workspace.sessions.push(session);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      this.appService.toast('Account Number or Role Must be unique.', ToastLevel.WARN, 'Create Account');
      return false;
    }
  }

  /**
   * List the truster accounts in the parent account
   */
  listTrusterAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.sessions.filter(ele => ((ele.account.parent !== undefined && ele.account.type === AccountType.AWS)));
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
