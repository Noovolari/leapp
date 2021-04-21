import {AccountType} from '../models/AccountType';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {CredentialsService} from '../services/credentials.service';
import {FileService} from '../services-system/file.service';
import {RefreshCredentialsStrategy} from './refreshCredentialsStrategy';
import {TimerService} from '../services/timer-service';
import {Workspace} from '../models/workspace';
import {Session} from '../models/session';
import {AwsSsoService} from '../integrations/providers/aws-sso.service';
import {AwsSsoAccount} from '../models/aws-sso-account';
import {catchError, map, switchMap} from 'rxjs/operators';

import {AwsCredential} from '../models/credential';
import {ConfigurationService} from '../services-system/configuration.service';
import {environment} from '../../environments/environment';
import {KeychainService} from '../services-system/keychain.service';
import {Observable, of} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {GetRoleCredentialsResponse} from 'aws-sdk/clients/sso';
import {SessionService} from '../services/session.service';


export class AwsSsoStrategy extends RefreshCredentialsStrategy {

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private fileService: FileService,
    private timerService: TimerService,
    private awsSsoService: AwsSsoService,
    private configurationService: ConfigurationService,
    private sessionService: SessionService,
    private keychainService: KeychainService) {
    super();
  }

  getActiveSessions(workspace: Workspace) {
    return workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_TRUSTER ||
        sess.account.type === AccountType.AWS_SSO ||
        sess.account.type === AccountType.AWS_PLAIN_USER ||
        sess.account.type === AccountType.AWS) && sess.active;
    });
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      this.fileService.iniCleanSync(this.appService.awsCredentialPath());
      this.timerService.noAwsSsoSessionsActive = true;
    }
  }

  manageSingleSession(workspace, session): Observable<boolean> {
    if (this.timerService.noAwsSsoSessionsActive === true) {
      this.timerService.noAwsSsoSessionsActive = false;
    }

    if (session.account.type === AccountType.AWS_SSO) {
      return this.awsCredentialProcess(workspace, session);
    } else {
      // We need this because we have checked also for non AWS_SSO potential active sessions,
      // so for them we don't create credentials but just return an empty observable for the
      // catch method
      return of(true);
    }
  }

  private awsCredentialProcess(workspace: Workspace, session: Session): Observable<boolean> {
    // Retrieve access token and region
    return this.awsSsoService.getAwsSsoPortalCredentials().pipe(
      switchMap((loginToAwsSSOResponse) => {
        return this.awsSsoService.getRoleCredentials(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region, (session.account as AwsSsoAccount).accountNumber, (session.account as AwsSsoAccount).role.name);
      }),
      map((getRoleCredentialsResponse: GetRoleCredentialsResponse) => {
        const credential: AwsCredential = {};
        credential.aws_access_key_id = getRoleCredentialsResponse.roleCredentials.accessKeyId;
        credential.aws_secret_access_key = getRoleCredentialsResponse.roleCredentials.secretAccessKey;
        credential.aws_session_token = getRoleCredentialsResponse.roleCredentials.sessionToken;
        credential.region = session.account.region;
        return credential;
      }),
      switchMap((credential: AwsCredential) => {
        const profileName = this.configurationService.getNameFromProfileId(session.profile);
        const awsSsoCredentials = {};
        awsSsoCredentials[profileName] = credential;

        const account = `Leapp-ssm-data-${session.profile}`;

        return fromPromise(this.keychainService.saveSecret(environment.appName, account, JSON.stringify(credential))).pipe(
          map(() => {
            return awsSsoCredentials;
          })
        );
      }),
      switchMap((awsSsoCredentials) => {
        this.fileService.iniWriteSync(this.appService.awsCredentialPath(), awsSsoCredentials);
        this.configurationService.disableLoadingWhenReady(workspace, session);
        this.timerService.defineTimer();
        return of(true);
      }),
      catchError( (err) => {
        this.sessionService.stopSession(session);

        if (err.name === 'LeappSessionTimedOut') {
          this.appService.logger(err.toString(), LoggerLevel.WARN, this, err.stack);
          this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.WARN, 'AWS SSO warning.');
          return of(false);
        } else {
          this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
          this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');
          return of(false);
        }

      })
    );
  }
}
