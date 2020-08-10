import {EventEmitter, Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {SessionObject} from '../models/sessionData';
import {ConfigurationService} from '../services-system/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends NativeService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService) { super(); }

  /**
   * Add a new session: for us a session is a container for data usaful to generate and maintain a set of credentials when the app is running
   * @param accountNumber - the account number of the account
   * @param roleName - the role we want to assume
   * @param color - the color to give to the session to identify it in the UI
   * @param active - is the currently active session?
   * @return the result of the operation of adding a session
   */
  addSession(accountNumber: string, roleName: string, color: string, active: boolean = false): boolean {

    const workspace = this.configurationService.getDefaultWorkspaceSync();

    const account = workspace.accountRoleMapping.accounts.filter(acc => (acc.accountNumber === accountNumber))[0];
    const accountData = { accountName: account.accountName, accountNumber: account.accountNumber };

    const roleData = { name: roleName };

    const sessionData: SessionObject = {
      active,
      accountData,
      roleData,
      color
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
    const sessionExist = sessions.filter(ses => (ses.roleData.name === session.roleData.name && ses.accountData.accountNumber === session.accountData.accountNumber));

    if (sessionExist.length > 0) {
      workspace.currentSessionList = sessions.filter(ses => (!(ses.roleData.name === session.roleData.name && ses.accountData.accountNumber === session.accountData.accountNumber)));
      this.configurationService.updateWorkspaceSync(workspace);
    } else {
      this.appService.logger('the Selected Session does not exist', LoggerLevel.WARN);
      return false;
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
    const sessionExist = sessions.filter(ses => (ses.roleData.name === session.roleData.name && ses.accountData.accountNumber === session.accountData.accountNumber));
    if (sessionExist.length > 0) {
      // Set the session as false for all sessions as a starting point
      sessions.map(sess => (sess.active = false));
      // Set active only the selected one
      sessions.map(sess => {
        console.log(sess.accountData.accountNumber === session.accountData.accountNumber && sess.roleData.name === session.roleData.name);
        if (sess.accountData.accountNumber === session.accountData.accountNumber && sess.roleData.name === session.roleData.name) {
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
  stopSession() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.currentSessionList;
    sessions.map(sess => (sess.active = false));
    workspace.currentSessionList = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return true;
  }

  /**
   * This method filters all the account that are already in the main list providing only the choosable inside the select modal
   */
  actionableSessions() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = this.listSessions();
    const accountRoleMappings = workspace.accountRoleMapping;
    return accountRoleMappings.accounts.filter(acc => {
      const usedRoles = sessions.filter(acc2 => acc2.accountData.accountNumber === acc.accountNumber).map(sf => sf.roleData.name);
      acc.awsRoles = acc.awsRoles.filter(r => usedRoles.indexOf(r.name) === -1);
      return acc.awsRoles.length > 0;
    });
  }
}
