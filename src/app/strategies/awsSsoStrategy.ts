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
import {catchError, map, switchMap, tap} from 'rxjs/operators';

import {AwsCredential} from '../models/credential';
import {ConfigurationService} from '../services-system/configuration.service';
import {environment} from '../../environments/environment';
import {KeychainService} from '../services-system/keychain.service';
import {Observable, of, throwError} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {GetRoleCredentialsResponse} from 'aws-sdk/clients/sso';


export class AwsSsoStrategy extends RefreshCredentialsStrategy {

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private fileService: FileService,
    private timerService: TimerService,
    private awsSsoService: AwsSsoService,
    private configurationService: ConfigurationService,
    private keychainService: KeychainService) {
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
      this.timerService.noAwsSsoSessionsActive = true;
    }
  }

  manageSingleSession(workspace, session) {
    if (this.timerService.noAwsSsoSessionsActive === true) {
      this.timerService.noAwsSsoSessionsActive = false;
    }

    if (session.account.type === AccountType.AWS_SSO) {
      this.awsCredentialProcess(workspace, session);
    }
  }

  private awsCredentialProcess(workspace: Workspace, session: Session) {
    // Retrieve access token and region
    this.awsSsoService.getAwsSsoPortalCredentials().pipe(
      switchMap((loginToAwsSSOResponse) => {
        return this.awsSsoService.getRoleCredentials(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region, (session.account as AwsSsoAccount).accountNumber, (session.account as AwsSsoAccount).role.name);
      }),
      switchMap((getRoleCredentialsResponse: GetRoleCredentialsResponse) => {
        const credential: AwsCredential = {};
        credential.aws_access_key_id = getRoleCredentialsResponse.roleCredentials.accessKeyId;
        credential.aws_secret_access_key = getRoleCredentialsResponse.roleCredentials.secretAccessKey;
        credential.aws_session_token = getRoleCredentialsResponse.roleCredentials.sessionToken;

        session.active = true;
        session.loading = false;

        return of(credential);
      }),
      switchMap((credential: AwsCredential) => {
        const awsSsoCredentials = { default: credential };
        return fromPromise(this.keychainService.saveSecret(environment.appName, `Leapp-ssm-data`, JSON.stringify(credential))).pipe(
          map(() => {
            return awsSsoCredentials;
          })
        );
      }),
      catchError( (err) => {
        session.active = false;
        session.loading = false;

        this.configurationService.disableLoadingWhenReady(workspace, session);
        this.fileService.iniWriteSync(this.appService.awsCredentialPath(), {});

        this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
        this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');

        return throwError(`Error in getAwsSsoPortalCredentials: ${err.toString()}`);
      })
    ).subscribe((awsSsoCredentials) => {
      this.configurationService.disableLoadingWhenReady(workspace, session);
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), awsSsoCredentials);
      this.timerService.defineTimer();
    });
  }
}
