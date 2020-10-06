import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {v4 as uuidv4} from 'uuid';
import {Session} from '../models/session';
import {AppService, ToastLevel} from '../services-system/app.service';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {KeychainService} from '../services-system/keychain.service';
import {AccountType} from '../models/AccountType';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FederatedAccountService extends NativeService {

  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private keychainService: KeychainService
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
  addFederatedAccountToWorkSpace(accountNumber: string, accountName: string, role: any, idpArn: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // Verify it not exists
    const test = workspace.sessions.filter(sess => (sess.account as AwsAccount).accountNumber === accountNumber && sess.account.role && sess.account.role.name === role.name);
    if (!test || test.length === 0) {
      // add new account
      const account = {
        accountId: accountNumber,
        accountName,
        accountNumber,
        role,
        idpArn,
        region,
        idpUrl: configuration.federationUrl,
        type: AccountType.AWS,
        parent: undefined,
        parentRole: undefined
      };

      const session: Session = {
        id: uuidv4(),
        active: false,
        loading: false,
        lastStopDate: new Date().toISOString(),
        account
      };

      workspace.sessions.push(session);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;

    } else {
      this.appService.toast('Account Number and Role Must be unique.', ToastLevel.WARN, 'Create Account');
      return false;
    }
  }

  /**
   * Add a new Federated Account to workspace
   * @param accountNumber - the account number
   * @param accountName - the account name
   * @param user - the Aws user added
   * @param secretKey - secret key of the user
   * @param accessKey - access key of the AWS user
   */
  addPlainAccountToWorkSpace(accountNumber: string, accountName: string, user: string, secretKey: string, accessKey: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const configuration = this.configurationService.getConfigurationFileSync();

    // Verify it not exists
    const test = workspace.sessions.filter(sess => (sess.account as AwsPlainAccount).accountNumber === accountNumber && (sess.account as AwsPlainAccount).user === user);
    if (!test || test.length === 0) {
      // add new account
      const account = {
        accountId: accountNumber,
        accountName,
        accountNumber,
        region,
        type: AccountType.AWS_PLAIN_USER,
        user
      };

      const session: Session = {
        id: uuidv4(),
        active: false,
        loading: false,
        lastStopDate: new Date().toISOString(),
        account
      };

      this.keychainService.saveSecret(environment.appName, this.appService.keychainGenerateAccessString(accountName, user), accessKey);
      this.keychainService.saveSecret(environment.appName, this.appService.keychainGenerateSecretString(accountName, user), secretKey);

      workspace.sessions.push(session);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;

    } else {
      this.appService.toast('Account Number and User Must be unique.', ToastLevel.WARN, 'Create Account');
      return false;
    }
  }

  /**
   * List all federated account in the workspace
   */
  listFederatedAccountInWorkSpace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace && workspace.sessions && workspace.sessions.length > 0) {
      return workspace.sessions.filter(sess => (sess.account.type === AccountType.AWS && sess.account.parent === undefined && sess.account.role.parent === undefined)); // .map(s => s.account);
    } else {
      return [];
    }
  }

  listPlainAccountsInWorkspace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace && workspace.sessions && workspace.sessions.length > 0) {
      return workspace.sessions.filter(sess => (sess.account.type === AccountType.AWS_PLAIN_USER)); // .map(s => s.account);
    } else {
      return [];
    }
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

  deleteFederatedPlainAccount(sessionId: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const index = workspace.sessions.findIndex(sess => sess.id === sessionId);
    if (index !== -1) {
      const session = workspace.sessions[index];
      this.keychainService.deletePassword(environment.appName, this.appService.keychainGenerateAccessString(session.account.accountName, (session.account as AwsPlainAccount).user));
      this.keychainService.deletePassword(environment.appName, this.appService.keychainGenerateSecretString(session.account.accountName, (session.account as AwsPlainAccount).user));
      return true;
    } else {
      return false;
    }

  }

  cleanKeychainIfNecessary(session: Session) {
    if (session.account.type === AccountType.AWS_PLAIN_USER) {
      this.deleteFederatedPlainAccount(session.id);
    }
  }
}
