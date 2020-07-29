import {EventEmitter, Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {SessionObject} from '../models/sessionData';
import {ConfigurationService} from '../services-system/configuration.service';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {SessionStatus} from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends NativeService {

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService) { super(); }

  addSession(accountNumber: string, roleName: string, color: string, active: boolean = false) {

    const workspace = this.configurationService.getDefaultWorkspaceSync();

    const account = workspace.accountRoleMapping.accounts.filter(acc => (acc.accountNumber === accountNumber))[0];
    const accountData = { accountName: account.accountName, accountNumber: account.accountNumber };

    const roleData = { name: roleName };

    const sessionData: SessionObject = {
      active,
      accountData,
      roleData,
      showTray: false,
      color
    };

    const alreadyExist = workspace.currentSessionList.filter(session => (session.accountData === sessionData.accountData && session.roleData === sessionData.roleData));
    if (alreadyExist.length === 0) {
      workspace.currentSessionList.push(sessionData);
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      return false;
    }
  }

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

  listSessions() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    return workspace.currentSessionList;
  }

  startSession(session: SessionObject) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.currentSessionList;
    const sessionExist = sessions.filter(ses => (ses.roleData.name === session.roleData.name && ses.accountData.accountNumber === session.accountData.accountNumber));
    if (sessionExist.length > 0) {
      sessions.map(sess => (sess.active = false));
      sessions.map(sess => {
        console.log(sess.accountData.accountNumber === session.accountData.accountNumber && sess.roleData.name === session.roleData.name);
        if (sess.accountData.accountNumber === session.accountData.accountNumber && sess.roleData.name === session.roleData.name) {
          sess.active = true;
        }
      });
      workspace.currentSessionList = sessions;
      this.configurationService.updateWorkspaceSync(workspace);
      return true;
    } else {
      this.appService.logger('the Selected Session does not exist', LoggerLevel.WARN);
      return false;
    }
  }

  stopSession() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.currentSessionList;
    sessions.map(sess => (sess.active = false));
    workspace.currentSessionList = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return true;
  }

  actionableSessions() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = this.listSessions();
    const accountRoleMappings = workspace.accountRoleMapping;
    return accountRoleMappings.accounts.filter(acc => {
      const usedRoles = sessions.filter(acc2 => acc2.accountData.accountNumber === acc.accountNumber).map(sf => sf.roleData.name);
      console.log(usedRoles);
      acc.awsRoles = acc.awsRoles.filter(r => usedRoles.indexOf(r.name) === -1);
      return acc.awsRoles.length > 0;
    });
  }
}
