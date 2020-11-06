import {AccountType} from '../models/AccountType';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {CredentialsService} from '../services/credentials.service';
import {FileService} from '../services-system/file.service';
import {RefreshCredentialsStrategy} from './refreshCredentialsStrategy';
import {TimerService} from '../services/timer-service';
import {Workspace} from '../models/workspace';
import {Session} from '../models/session';
import {AwsSsoService} from '../integrations/providers/aws-sso.service';
import {AwsSsoAccount} from '../models/aws-sso-account';
import {switchMap} from 'rxjs/operators';

// Import AWS node style
const AWS = require('aws-sdk');

export class AwsSsoStrategy extends RefreshCredentialsStrategy {

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private fileService: FileService,
    private timerService: TimerService,
    private awsSsoService: AwsSsoService) {
    super();
  }

  getActiveSessions(workspace: Workspace) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_SSO) && sess.active;
    });

    console.log('active aws sso sessions', activeSessions);
    this.appService.logger('Aws sso Active sessions', LoggerLevel.INFO, this, JSON.stringify(activeSessions, null, 3));
    return activeSessions;
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), {});
      this.timerService.clearTimer();
    }
  }

  manageSingleSession(workspace, session) {
    if (session.account.type === AccountType.AWS_SSO) {
      this.awsCredentialProcess(workspace, session);
    }
  }

  private awsCredentialProcess(workspace: Workspace, session: Session) {
    // Retrieve access token and region
    this.awsSsoService.getAwsSsoPortalCredentials().pipe(
      switchMap((loginToAwsSSOResponse) =>  this.awsSsoService.getRoleCredentials(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region, (session.account as AwsSsoAccount).accountNumber, (session.account as AwsSsoAccount).role.name))
    ).subscribe(console.log);
  }

}
