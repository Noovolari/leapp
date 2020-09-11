import {EventEmitter, Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {SessionObject} from '../models/sessionData';
import {ConfigurationService} from '../services-system/configuration.service';
import {AwsAccount} from '../models/aws-account';
import {AzureAccount} from '../models/azure-account';
import {AzureAccountService} from './azure-account.service';
import {FederatedAccountService} from './federated-account.service';
import {TrusterAccountService} from './truster-account.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends NativeService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private azureAccountService: AzureAccountService,
    private awsFederatedAccountService: FederatedAccountService,
    private awsTrusterAccountService: TrusterAccountService) { super(); }

  /**
   * Add a new session: for us a session is a container for data usaful to generate and maintain a set of credentials when the app is running
   * @param accountNumber - the account number of the account
   * @param roleName - the role we want to assume
   * @param active - is the currently active session?
   * @return the result of the operation of adding a session
   */
  addSession(accountNumber: string, roleName: string, active: boolean = false): boolean {

    const workspace = this.configurationService.getDefaultWorkspaceSync();



    const account = workspace.accountRoleMapping.accounts.filter(acc => ((acc as AwsAccount).accountNumber === accountNumber || ((acc as AzureAccount).subscriptionId)))[0];
    const accountData = { accountName: account.accountName, accountNumber: account.accountNumber, subscriptionId: account.subscriptionId };

    const roleData = { name: roleName }; // can be null for Azure so we also have this information to discriminate

    const sessionData: SessionObject = {
      active,
      accountData,
      roleData,
      loading: false
    };

    const alreadyExist = workspace.currentSessionList.filter(session => (session.accountData === sessionData.accountData && session.roleData === sessionData.roleData));
    // Once prepared the session object we verify if we can add it or not to the list and return a boolean about the operation
    if (alreadyExist.length === 0) {
      workspace.currentSessionList.push(sessionData);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Remove a session from the list of sessions
   * @param session -
   */
  removeSession(session) {

    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.currentSessionList;
    const sessionExist = sessions.findIndex(ses => (ses.roleData.name === session.roleData.name && (ses.accountData.accountNumber === session.accountData.accountNumber || ses.accountData.subscriptionId === session.accountData.subscriptionId)));

    if (sessionExist > 0) {
      sessions.splice(sessionExist, 1);
      workspace.currentSessionList = sessions;
      this.configurationService.updateWorkspaceSync(workspace);
    } else {
      this.appService.logger('the Selected Session does not exist', LoggerLevel.WARN);
      return false;
    }
  }

  deleteSessionFromWorkspace(session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const accounts = workspace.accountRoleMapping;
    const sessionExist = accounts.accounts.filter(ses => ((ses as AwsAccount).accountNumber === session.accountData.accountNumber || (ses as AzureAccount).subscriptionId === session.accountData.subscriptionId));

    if (sessionExist.length > 0) {
      // Ok we have the account, now remove it
      if (session.accountData.accountNumber) {
        // is one or the other, we can launch both method as they fail gracefully if no account is found
        this.awsFederatedAccountService.deleteFederatedAccount(session.accountData.accountNumber, session.roleData.name);
        this.awsTrusterAccountService.deleteTrusterAccount(session.accountData.accountNumber, session.roleData.name);
      } else {
        this.azureAccountService.deleteAzureAccount(session.accountData.subscriptionId);
      }
    }
  }

  /**
   * List sessions inside the current Session list containing all sessions
   */
  listSessions() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.currentSessionList;
  }

  /**
   * Start a session, given the session object
   * @param session - the session object to extract the parameter to generate the credentials
   */
  startSession(session: SessionObject) {
    // Get the current workspace
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    // Get the session list
    const sessions = workspace.currentSessionList;

    // Verify the session exists or not: we do this by checking the role name and the account number
    // Get the session
    const sessionExist = sessions.filter(ses => (ses.roleData.name === session.roleData.name && ses.accountData.accountNumber === session.accountData.accountNumber) || (session.accountData.subscriptionId && ses.accountData.subscriptionId === session.accountData.subscriptionId));
    if (sessionExist.length > 0) {
      // Set the session as false for all sessions as a starting point
      sessions.map(sess => {
        if (sess.active && this.appService.isAzure(sess) && this.appService.isAzure(session)) {
          sess.active = false;
        }
        if (sess.active && !this.appService.isAzure(sess) && !this.appService.isAzure(session)) {
          sess.active = false;
        }
      });
      // Set active only the selected one
      sessions.map(sess => {
        if ((sess.accountData.accountNumber === session.accountData.accountNumber && sess.roleData.name === session.roleData.name) || (session.accountData.subscriptionId && sess.accountData.subscriptionId === session.accountData.subscriptionId)) {
          sess.active = true;
        }
      });
      // Refresh the session list with the new values
      workspace.currentSessionList = sessions;
      this.configurationService.updateWorkspaceSync(workspace);
      // Return ok
      return true;
    } else {
      // Something went wrong return false
      this.appService.logger('the Selected Session does not exist', LoggerLevel.WARN);
      return false;
    }
  }

  /**
   * Stop the current session, setting it to false and updating the workspace
   */
  stopSession(session: SessionObject) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.currentSessionList;
    sessions.map(sess => {
      if (
        session === null ||
        (session.accountData.subscriptionId === sess.accountData.subscriptionId) ||
        (session.accountData.accountNumber === sess.accountData.accountNumber && session.roleData.name === sess.roleData.name)
      ) {
        sess.active = false;
      }
    });
    workspace.currentSessionList = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return true;
  }

  stopAllSession() {
    this.stopSession(null);
  }

  /**
   * This method filters all the account that are already in the main list providing only the choosable inside the select modal
   */
  actionableSessions() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = this.listSessions();
    const accountRoleMappings = workspace.accountRoleMapping;
    return accountRoleMappings.accounts.filter(acc => {
      const usedRoles = sessions.filter(acc2 => (acc2.accountData.accountNumber === acc.accountNumber || acc2.accountData.subscriptionId === acc.subscriptionId)).map(sf => sf.roleData.name);
      acc.awsRoles = acc.awsRoles.filter(r => usedRoles.indexOf(r.name) === -1);
      return acc.awsRoles.length > 0;
    });
  }
}
