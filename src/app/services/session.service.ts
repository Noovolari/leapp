import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {Session} from '../models/session';
import {ConfigurationService} from '../services-system/configuration.service';
import {Account} from '../models/account';
import {AzureAccountService} from './azure-account.service';
import {FederatedAccountService} from './federated-account.service';
import {TrusterAccountService} from './truster-account.service';
import { v4 as uuidv4 } from 'uuid';

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
  addSession(account: Account, active: boolean = false): boolean {

    const workspace = this.configurationService.getDefaultWorkspaceSync();

    const session: Session = {
      id: uuidv4(),
      active: false,
      loading: false,
      account
    };

    const alreadyExist = workspace.sessions.filter(s => (session.id === s.id)).length;
    // Once prepared the session object we verify if we can add it or not to the list and return a boolean about the operation
    if (alreadyExist === 0) {
      workspace.sessions.push(session);
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
    const sessions = workspace.sessions.filter(ses =>  ses.id !== session.id) || [];
    workspace.sessions = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return false;
  }

  /**
   * List sessions inside the current Session list containing all sessions
   */
  listSessions() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.sessions;
  }

  /**
   * Start a session, given the session object
   * @param session - the session object to extract the parameter to generate the credentials
   */
  startSession(session: Session) {
    // Get the current workspace
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    // Get the session list
    const sessions = workspace.sessions;

    // Verify the session exists or not: we do this by checking the role name and the account number
    // Get the session
    const sessionExist = sessions.filter(ses => ses.id === session.id);
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
        if (sess.id === session.id) {
          sess.active = true;
        }
      });
      // Refresh the session list with the new values
      workspace.sessions = sessions;
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
  stopSession(session: Session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.sessions;
    sessions.map(sess => {
      if (session === null || session.id === sess.id) {
        sess.active = false;
      }
    });
    workspace.sessions = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return true;
  }

  stopAllSession() {
    this.stopSession(null);
  }
}
