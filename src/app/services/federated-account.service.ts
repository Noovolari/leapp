import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import { v4 as uuidv4 } from 'uuid';
import {Session} from '../models/session';

@Injectable({
  providedIn: 'root'
})
export class FederatedAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService
  ) {
    super();
  }

  /**
   * Add a new Federated Account to workspace
   * @param accountNumber - the account number
   * @param accountName - the account name
   * @param role - the role to add to the account
   * @param idpArn - the idp arn as it is federated
   */
  addFederatedAccountToWorkSpace(accountNumber: string, accountName: string, role: any, idpArn: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // Verify it not exists
    const test = workspace.sessions.filter(sess => (sess.account as AwsAccount).accountNumber.toString() === accountNumber.toString());
    if (!test || test.length === 0) {
      // add new account
      const account = {
        accountId: accountNumber,
        accountName,
        accountNumber,
        role,
        idpArn,
        idpUrl: configuration.federationUrl,
        type: 'AWS',
        parent: undefined,
        parentRole: undefined
      };

      const session: Session = {
        id: uuidv4(),
        active: false,
        loading: false,
        account
      };

      workspace.sessions.push(session);
      this.configurationService.updateWorkspaceSync(workspace);
      console.log('2');
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
    if (workspace && workspace.sessions && workspace.sessions.length > 0) {
      return workspace.sessions.filter(sess => (sess.account.type === 'AWS' && sess.account.parent === undefined && sess.account.role.parent === undefined)).map(s => s.account);
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
    return workspace.sessions.filter(sess => (sess.account.accountNumber === accountNumber))[0].account;
  }

  /**
   * Delete a federated account
   * @param sessionId - account number of the account to delete
   */
  deleteFederatedAccount(sessionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.sessions.findIndex(sess => sess.id === sessionId);
    if (index !== -1) {
      workspace.sessions.splice(index, 1);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }

  }

}
