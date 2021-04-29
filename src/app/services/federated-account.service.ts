import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AwsAccount} from '../models/aws-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {v4 as uuidv4} from 'uuid';
import {Session} from '../models/session';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
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
   * @param idpUrl -the selected idp id and url
   * @param accountNumber - the account number
   * @param accountName - the account name
   * @param role - the role to add to the account
   * @param idpArn - the idp arn as it is federated
   * @param region - the region to select as default
   */
  addFederatedAccountToWorkSpace(idpUrl: {id: string, url: string}, accountNumber: string, accountName: string, role: any, idpArn: string, region: string) {

    console.log('idpurl', idpUrl);

    const workspace = this.configurationService.getDefaultWorkspaceSync();

    if (role.name[0] === '/') {
      role.name = role.name.substr(1);
    }

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
        idpUrl: idpUrl.id,
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

      console.log('idpurl in workspace', workspace.idpUrl);

      if (workspace.idpUrl.findIndex(i => i && i.id === idpUrl.id) === -1) {
        workspace.idpUrl.push(idpUrl);
      }

      console.log('idpurl in workspace after', workspace.idpUrl);

      workspace.sessions.push(session);
      this.configurationService.updateWorkspaceSync(workspace);
      console.log('sessions now', workspace.sessions);

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
   * @param region - the region to set as default
   */
  addPlainAccountToWorkSpace(accountNumber: string, accountName: string, user: string, secretKey: string, accessKey: string, mfaDevice: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    // Verify it not exists
    const test = workspace.sessions.filter(sess => (sess.account as AwsPlainAccount).accountNumber === accountNumber && (sess.account as AwsPlainAccount).user === user);
    if (!test || test.length === 0) {
      // add new account
      const account = {
        accountId: accountNumber,
        accountName,
        accountNumber,
        mfaDevice,
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

      try {
        this.keychainService.saveSecret(environment.appName, this.appService.keychainGenerateAccessString(accountName, user), accessKey);
        this.keychainService.saveSecret(environment.appName, this.appService.keychainGenerateSecretString(accountName, user), secretKey);

        workspace.sessions.push(session);
        this.configurationService.updateWorkspaceSync(workspace);

        return true;
      } catch (err) {
        this.appService.toast(`Error in saving credentials to keychain for: ${accountName}`, ToastLevel.WARN, 'Create Account');
        this.appService.logger(`Error in saving credentials to keychain for: ${accountName}`, LoggerLevel.ERROR, this, err.stack);
        return false;
      }
    } else {
      this.appService.toast('Account Number and User Must be unique.', ToastLevel.WARN, 'Create Account');
      return false;
    }
  }

  /**
   * Add a new Federated Account to workspace
   * @param session - the session to be edited
   * @param accessKey - the access key to inject in the vault, note: they are NOT saved in Leapp
   * @param secretKey - the secret key to inject in the vault, note: they are NOT saved in Leapp
   * @param mfaDevice - the mfaDevice (optional) to associate to the plain account
   * @param region - the default region to use
   */
  editPlainAccountToWorkSpace(session: Session, accessKey: string, secretKey: string, mfaDevice: string, region: string) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    // Update the value also in the session
    workspace.sessions.map(sess => {
      if (sess.id === session.id) {
        sess.account.region = region;
        sess.account.mfaDevice = mfaDevice;
        return sess;
      }
    });

    // Update the values in the vault
    this.keychainService.saveSecret(environment.appName, this.appService.keychainGenerateAccessString(session.account.accountName, (session.account as AwsPlainAccount).user), accessKey);
    this.keychainService.saveSecret(environment.appName, this.appService.keychainGenerateSecretString(session.account.accountName, (session.account as AwsPlainAccount).user), secretKey);

    this.configurationService.updateWorkspaceSync(workspace);

    this.keychainService.deletePassword(environment.appName, this.generatePlainAccountSessionTokenExpirationString(session));
    this.keychainService.deletePassword(environment.appName, this.generatePlainAccountSessionTokenString(session));

    const childSessions = workspace.sessions.filter(sess => sess.account.parent === session.id);

    childSessions.forEach(sess => {
      this.keychainService.deletePassword(environment.appName, this.generateTrusterAccountSessionTokenExpirationString(sess));
      this.keychainService.deletePassword(environment.appName, this.generateTrusterAccountSessionTokenString(sess));
    });

    return true;
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

      workspace.sessions.splice(index, 1);
      this.configurationService.updateWorkspaceSync(workspace);
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

  private generatePlainAccountSessionTokenExpirationString(session: any) {
    return 'plain-account-session-token-expiration-' + session.account.accountName;
  }

  private generateTrusterAccountSessionTokenExpirationString(session: any) {
    return 'truster-account-session-token-expiration-' + session.account.accountName;
  }

  private generatePlainAccountSessionTokenString(session: any) {
    return 'plain-account-session-token-' + session.account.accountName;
  }

  private generateTrusterAccountSessionTokenString(session: any) {
    return 'truster-account-session-token-' + session.account.accountName;
  }

}
