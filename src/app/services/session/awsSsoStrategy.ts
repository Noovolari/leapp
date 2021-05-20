import {SessionType} from '../../models/session-type';
import {AppService, LoggerLevel, ToastLevel} from '../app.service';
import {FileService} from '../file.service';
import {Workspace} from '../../models/workspace';
import {Session} from '../../models/session';
import {AwsSsoService} from '../../integrations/providers/aws-sso.service';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {catchError, map, switchMap} from 'rxjs/operators';

import {AwsCredential} from '../../models/credential';
import {ConfigurationService} from '../configuration.service';
import {environment} from '../../../environments/environment';
import {KeychainService} from '../keychain.service';
import {Observable, of} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {GetRoleCredentialsResponse} from 'aws-sdk/clients/sso';
import {SessionService} from '../session.service';
import {SessionStatus} from '../../models/session-status';


export class AwsSsoStrategy {

  constructor(
    private appService: AppService,
    private fileService: FileService,
    private awsSsoService: AwsSsoService,
    private configurationService: ConfigurationService,
    private sessionService: SessionService,
    private keychainService: KeychainService) {}

  getActiveSessions(workspace: Workspace) {
    return workspace.sessions.filter((sess) => (sess.account.type === SessionType.awsTruster ||
        sess.account.type === SessionType.awsSso ||
        sess.account.type === SessionType.awsPlain ||
        sess.account.type === SessionType.awsFederated) && sess.status === SessionStatus.active);
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      this.fileService.iniCleanSync(this.appService.awsCredentialPath());
    }
  }

  manageSingleSession(workspace, session): Observable<boolean> {


    if (session.account.type === SessionType.awsSso) {
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
      switchMap((loginToAwsSSOResponse) => this.awsSsoService.getRoleCredentials(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region, (session.account as AwsSsoAccount).accountNumber, (session.account as AwsSsoAccount).role.name)),
      map((getRoleCredentialsResponse: GetRoleCredentialsResponse) => {
        const credential: AwsCredential = {};
        credential.aws_access_key_id = getRoleCredentialsResponse.roleCredentials.accessKeyId;
        credential.aws_secret_access_key = getRoleCredentialsResponse.roleCredentials.secretAccessKey;
        credential.aws_session_token = getRoleCredentialsResponse.roleCredentials.sessionToken;
        credential.region = session.account.region;
        return credential;
      }),
      switchMap((credential: AwsCredential) => {
        const profileName = this.configurationService.getNameFromProfileId((session.account as AwsSsoAccount).profileId);
        const awsSsoCredentials = {};
        awsSsoCredentials[profileName] = credential;

        const account = `Leapp-ssm-data-${(session.account as AwsSsoAccount).profileId}`;

        return fromPromise(this.keychainService.saveSecret(environment.appName, account, JSON.stringify(credential))).pipe(
          map(() => awsSsoCredentials)
        );
      }),
      switchMap((awsSsoCredentials) => {
        this.fileService.iniWriteSync(this.appService.awsCredentialPath(), awsSsoCredentials);
        // this.configurationService.disableLoadingWhenReady(workspace, session);
        return of(true);
      }),
      catchError( (err) => {
        // this.sessionService.stop(session.sessionId);

        if (err.name === 'LeappSessionTimedOut') {
          this.appService.logger(err.toString(), LoggerLevel.warn, this, err.stack);
          this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.warn, 'AWS SSO warning.');
          return of(false);
        } else {
          this.appService.logger(err.toString(), LoggerLevel.error, this, err.stack);
          this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.error, 'AWS SSO error.');
          return of(false);
        }

      })
    );
  }
}
