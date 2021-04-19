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
import {catchError, last, map, switchMap} from 'rxjs/operators';

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
    const activeSessions = workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_TRUSTER ||
        sess.account.type === AccountType.AWS_SSO ||
        sess.account.type === AccountType.AWS_PLAIN_USER ||
        sess.account.type === AccountType.AWS) && sess.active;
    });

    return activeSessions;
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
      switchMap((getRoleCredentialsResponse: GetRoleCredentialsResponse) => {
        const credential: AwsCredential = {};
        credential.aws_access_key_id = getRoleCredentialsResponse.roleCredentials.accessKeyId;
        credential.aws_secret_access_key = getRoleCredentialsResponse.roleCredentials.secretAccessKey;
        credential.aws_session_token = getRoleCredentialsResponse.roleCredentials.sessionToken;
        credential.region = session.account.region;

        session.active = true;
        session.loading = false;

        return of(credential);
      }),
      switchMap((credential: AwsCredential) => {

        const profileName = this.configurationService.getNameFromProfileId(session.profile);
        const awsSsoCredentials = {};
        awsSsoCredentials[profileName] = credential;
        return fromPromise(this.keychainService.saveSecret(environment.appName, `Leapp-ssm-data`, JSON.stringify(credential))).pipe(
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
        session.active = false;
        session.loading = false;

        this.sessionService.stopSession(session);
        this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
        this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');
        return of(false);
      })
    );
  }
}
