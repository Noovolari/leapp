import {AccountType} from '../models/AccountType';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {AwsCredential, AwsCredentials} from '../models/credential';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {ConfigurationService} from '../services-system/configuration.service';
import {CredentialsService} from '../services/credentials.service';
import {environment} from '../../environments/environment';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {FileService} from '../services-system/file.service';
import {KeychainService} from '../services-system/keychain.service';
import {RefreshCredentialsStrategy} from './refreshCredentialsStrategy';
import {TimerService} from '../services/timer-service';
import {Workspace} from '../models/workspace';
import {WorkspaceService} from '../services/workspace.service';
import {Observable, of, Subscriber, Subscription} from 'rxjs';
import {constants} from '../core/enums/constants';
import {ProxyService} from '../services/proxy.service';
import {Session} from '../models/session';
import {catchError, switchMap} from 'rxjs/operators';
import {AwsSsoAccount} from '../models/aws-sso-account';
import {GetRoleCredentialsResponse} from 'aws-sdk/clients/sso';
import {AwsSsoService} from '../integrations/providers/aws-sso.service';
import {SessionService} from '../services/session.service';


// Import AWS node style
const AWS = require('aws-sdk');

export class AwsStrategy extends RefreshCredentialsStrategy {
  private processSubscription: Subscription;
  private processSubscriptionTruster: Subscription;

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private keychainService: KeychainService,
    private proxyService: ProxyService,
    private timerService: TimerService,
    private workspaceService: WorkspaceService,
    private sessionService: SessionService,
    private awsSsoService: AwsSsoService) {
    super();
  }

  getActiveSessions(workspace: Workspace) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_TRUSTER ||
              sess.account.type === AccountType.AWS_SSO ||
              sess.account.type === AccountType.AWS_PLAIN_USER ||
              sess.account.type === AccountType.AWS) && sess.active;
    });


    this.appService.logger('Aws Active sessions', LoggerLevel.INFO, this, JSON.stringify(activeSessions, null, 3));
    return activeSessions;
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      this.fileService.iniCleanSync(this.appService.awsCredentialPath());
      this.timerService.noAwsSessionsActive = true;
    }
  }

  manageSingleSession(workspace, session): Observable<boolean> {
    if (this.timerService.noAwsSessionsActive === true) {
      this.timerService.noAwsSessionsActive = false;
    }

    if (session.account.type === AccountType.AWS_PLAIN_USER) {
      return this.awsCredentialProcess(workspace, session);
    } else if (session.account.type === AccountType.AWS) {
      return this.awsCredentialFederatedProcess(workspace, session);
    } else {
      // This is necessary when a SSO session is present in the active list: the reason is that we need
      // to check also for AWS SSO sessions in the getActiveSessions() method, to avoid cleaning the file
      // when a SSO session is inside, thus we still need to return a "passthrough" observable to avoid crashing
      // the concat method in the base class.
      return of(true);
    }
  }

  /**
   * In this method we transform plain to temporary to avoid saving plain credential in the file
   * @param workspace - the workspace we are working on
   * @param session - the current session we use to retrieve information from
   */
  private awsCredentialProcess(workspace: Workspace, session): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.getIamUserAccessKeysFromKeychain(session).then(credentials => {
        this.keychainService.getSecret(environment.appName, this.generatePlainAccountSessionTokenExpirationString(session)).then(sessionTokenData => {
          if (sessionTokenData && this.isSessionTokenStillValid(sessionTokenData)) {
            this.applyPlainAccountSessionToken(workspace, session);
          } else {
            if (this.processSubscription) { this.processSubscription.unsubscribe(); }
            this.processSubscription = this.getPlainAccountSessionToken(credentials, session).subscribe((awsCredentials) => {
                const tmpCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(awsCredentials, workspace, session.account.region, session);

                this.keychainService.saveSecret(environment.appName, `plain-account-session-token-${session.account.accountName}`, JSON.stringify(tmpCredentials));
                this.savePlainAccountSessionTokenExpirationInVault(tmpCredentials, session);

                this.fileService.iniWriteSync(this.appService.awsCredentialPath(), tmpCredentials);
                this.configurationService.disableLoadingWhenReady(workspace, session);

                // Start Calculating time here once credentials are actually retrieved
                this.timerService.defineTimer();
                observer.next(true);
                observer.complete();
              },
              (err) => {
                this.appService.logger('Error in Aws Credential process', LoggerLevel.ERROR, this, err.stack);
                observer.error(false);
              });
          }
        });
      });
    });
  }

  private checkAccountTypeForRefreshCredentials(session) {
    if (session.account.type === AccountType.AWS && session.account.parent === undefined) {
      return 0;
    } else if (session.account.type === AccountType.AWS_TRUSTER || (session.account.type === AccountType.AWS && session.account.parent !== undefined)) {
      // Here we have a truster account now we need to know the nature of the truster account
      const parentAccountSessionId = session.account.parent;
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      const sessions = workspace.sessions;
      const parentAccountList = sessions.filter(sess => sess.id === parentAccountSessionId);

      if (parentAccountList.length > 0) {
        // Parent account found: check its nature
        if (parentAccountList[0].account.type === AccountType.AWS) { return 1; }
        if (parentAccountList[0].account.type === AccountType.AWS_PLAIN_USER ) { return 2; }
        if (parentAccountList[0].account.type === AccountType.AWS_SSO) { return 3; }
      }
    }
    return 0;
  }

  doubleJumpFromSSO(session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const parentSession = this.sessionService.parentSession(session);

    return this.awsSsoService.getAwsSsoPortalCredentials().pipe(
      switchMap((loginToAwsSSOResponse) => {
        return this.awsSsoService.getRoleCredentials(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region, (parentSession.account as AwsSsoAccount).accountNumber, (parentSession.account as AwsSsoAccount).role.name);
      }),
      switchMap((getRoleCredentialsResponse: GetRoleCredentialsResponse) => {
        const credential: AwsCredential = {};
        credential.aws_access_key_id = getRoleCredentialsResponse.roleCredentials.accessKeyId;
        credential.aws_secret_access_key = getRoleCredentialsResponse.roleCredentials.secretAccessKey;
        credential.aws_session_token = getRoleCredentialsResponse.roleCredentials.sessionToken;

        this.proxyService.configureBrowserWindow(this.appService.currentBrowserWindow());

        const params = {
          RoleArn: `arn:aws:iam::${session.account.accountNumber}:role/${session.account.role.name}`,
          RoleSessionName: this.appService.createRoleSessionName(session.account.role.name),
          DurationSeconds: 3600 // 1 hour for chained assume role
        };

        // Update AWS sdk with new credentials
        AWS.config.update({
          accessKeyId: credential.aws_access_key_id,
          secretAccessKey: credential.aws_secret_access_key,
          sessionToken: credential.aws_session_token
        });

        const sts = new AWS.STS(this.appService.stsOptions(session));

        sts.assumeRole(params, (err, data: any) => {
          if (err) {
            // Something went wrong save it to the logger file
            this.appService.logger('Error in assume role from AWS SSO to truster in get session token: ', LoggerLevel.ERROR, this, err.stack);
            this.appService.toast('Error assuming role from AWS SSO account, check log for details.', LoggerLevel.WARN, 'Assume role Error');

            // Emit ko for double jump
            this.workspaceService.credentialEmit.emit({status: err.stack, accountName: session.account.accountName});

            this.sessionService.stopSession(session);

            this.appService.cleanCredentialFile();
          } else {
            // We set the new credentials after the first jump
            const trusterCredentials: AwsCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.region, session);

            this.fileService.iniWriteSync(this.appService.awsCredentialPath(), trusterCredentials);

            this.configurationService.updateWorkspaceSync(workspace);
            this.configurationService.disableLoadingWhenReady(workspace, session);

            // Finished double jump
            this.appService.logger('Made it through Double jump from plain', LoggerLevel.INFO, this);
          }
        });

        return of(true);
      }),
      catchError( (err) => {
        workspace.sessions.forEach(sess => {
          if (sess.id === session.id) {
            sess.loading = false;
            sess.complete = false;
            sess.active = false;
          }
        });
        this.configurationService.updateWorkspaceSync(workspace);
        this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
        this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');

        return of(false);
      })
    );
  }

  awsCredentialFederatedProcess(workspace: Workspace | boolean, session: any): Observable<boolean> {
      // Check for Aws Credentials Process
      if (!workspace) {
        return of(false);
      }

      let returnedObservable: Observable<boolean>;

      // Enable current active session
      switch (this.checkAccountTypeForRefreshCredentials(session)) {
        case 0: returnedObservable = this.workspaceService.refreshCredentials(session); break;        // FEDERATED
        case 1: returnedObservable = this.workspaceService.refreshCredentials(session); break;        // TRUSTER FROM FEDERATED
        case 2: returnedObservable = this.doubleJumpFromFixedCredentialWithObserver(session); break;  // TRUSTER FROM PLAIN
        case 3: returnedObservable = this.doubleJumpFromSSO(session); break;                          // TRUSTER FROM SSO
      }

      // Pipe the
      return returnedObservable.pipe(
        catchError(e => {
          // This catch error is for panics which are not managed by their own procedures
          this.appService.logger('Error in Aws Credential Process', LoggerLevel.ERROR, this, e.stack);
          this.appService.toast('Error in Aws Credential Process: ' + e.toString(), ToastLevel.ERROR, 'Aws Credential Process');
          this.credentialsService.refreshReturnStatusEmit.emit(false);
          return of(false);
        }),
        switchMap(res => {
          // Start Calculating time here once credentials are actually retrieved
          this.timerService.defineTimer();
          // return ok for this credential set
          return of(true);
        })
      );
  }

  // TODO: move to AwsCredentialsGenerationService
  private getPlainAccountSessionToken(awsCredentials: AwsCredentials, session): Observable<any> {
    return new Observable<AwsCredentials>((observable) => {

      const processData = (data, err) => {
        if (data !== undefined && data !== null) {
          observable.next(data);
          observable.complete();
        } else {
          this.appService.logger('Error in get session token', LoggerLevel.ERROR, this, err.stack);
          observable.error(err);
          observable.complete();
          // Emit ko for double jump
          this.workspaceService.credentialEmit.emit({status: err.stack, accountName: session.account.accountName});
        }
      };

      AWS.config.update({
        accessKeyId: awsCredentials.default.aws_access_key_id,
        secretAccessKey: awsCredentials.default.aws_secret_access_key
      });

      const sts = new AWS.STS(this.appService.stsOptions(session));
      const params = { DurationSeconds: environment.sessionTokenDuration };

      this.keychainService.getSecret(environment.appName, this.generatePlainAccountSessionTokenExpirationString(session)).then(sessionTokenData => {
        if (sessionTokenData && this.isSessionTokenStillValid(sessionTokenData)) {
          processData(sessionTokenData, null);
        } else {
          if (this.checkIfMfaIsNeeded(session)) {
            // We Need a MFA BUT Now we need to retrieve a refresh token
            // from the vault to see if the session is still refreshable
            this.showMFAWindowAndAuthenticate(params, session, null, () => {
              sts.getSessionToken(params, (err, data) => {
                processData(data, err);
              });
            });
          } else {
            sts.getSessionToken(params, (err, data) => {
              processData(data, err);
            });
          }
        }
      });
    });
  }

  // TODO: move to KeychainService
  private async getIamUserAccessKeysFromKeychain(session) {
    const accessKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(session.account.accountName, (session.account as AwsPlainAccount).user));
    const secretKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(session.account.accountName, (session.account as AwsPlainAccount).user));
    const credentials = {default: {aws_access_key_id: accessKey, aws_secret_access_key: secretKey}};
    return credentials;
  }

  private async doubleJumpFromFixedCredential(observer: Subscriber<boolean>, session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.sessions;
    const parentAccountSessionId = session.account.parent;
    const parentSessions = sessions.filter(sess => sess.id === parentAccountSessionId);

    if (parentSessions.length > 0) {
      // Parent account found: do double jump
      const parentSession = parentSessions[0];

      // First jump
      const accessKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(parentSession.account.accountName, (parentSession.account as AwsPlainAccount).user));
      const secretKey = await this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(parentSession.account.accountName, (parentSession.account as AwsPlainAccount).user));
      const credentials = {default: {aws_access_key_id: accessKey, aws_secret_access_key: secretKey}};

      this.proxyService.configureBrowserWindow(this.appService.currentBrowserWindow());

      const params = {
        RoleArn: `arn:aws:iam::${session.account.accountNumber}:role/${session.account.role.name}`,
        RoleSessionName: this.appService.createRoleSessionName(session.account.role.name),
        DurationSeconds: 3600 // 1 hour for chained assume role
      };

      const processData = (p) => {
        if (this.processSubscriptionTruster) { this.processSubscriptionTruster.unsubscribe(); }
        this.processSubscriptionTruster = this.getTrusterAccountSessionToken(credentials, parentSession, session).subscribe((awsCredentials) => {
            // Update AWS sdk with new credentials
            AWS.config.update({
              accessKeyId: awsCredentials.default.aws_access_key_id,
              secretAccessKey: awsCredentials.default.aws_secret_access_key,
              sessionToken: awsCredentials.default.aws_session_token
            });

            const sts = new AWS.STS(this.appService.stsOptions(session));

            sts.assumeRole(p, (err, data: any) => {
              if (err) {
                // Something went wrong save it to the logger file
                this.appService.logger('Error in assume role from plain to truster in get session token: ', LoggerLevel.ERROR, this, err.stack);
                this.appService.toast('Error assuming role from plain account, check log for details.', LoggerLevel.WARN, 'Assume role Error');

                // Emit ko for double jump
                this.workspaceService.credentialEmit.emit({status: err.stack, accountName: session.account.accountName});

                workspace.sessions.forEach(sess => { if (sess.id === session.id) { sess.active = false; } });
                this.configurationService.disableLoadingWhenReady(workspace, session);

                this.appService.cleanCredentialFile();
                observer.next(false);
                observer.complete();
              } else {
                // We set the new credentials after the first jump
                const trusterCredentials: AwsCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.region, session);

                this.fileService.iniWriteSync(this.appService.awsCredentialPath(), trusterCredentials);

                this.configurationService.updateWorkspaceSync(workspace);
                this.configurationService.disableLoadingWhenReady(workspace, session);

                // Finished double jump
                this.appService.logger('Made it through Double jump from plain', LoggerLevel.INFO, this);
                observer.next(true);
                observer.complete();
              }
            });
          },
          (err) => {
            this.appService.logger('Error in Aws Credential process', LoggerLevel.ERROR, this, err.stack);
            this.appService.toast('Error in Aws Credential process, check log for details.', LoggerLevel.WARN, 'Aws Credential process Error');

            // Emit ko for double jump
            this.workspaceService.credentialEmit.emit({status: err.stack, accountName: session.account.accountName});

            workspace.sessions.forEach(sess => { if (sess.id === session.id) { sess.active = false; } });
            this.configurationService.disableLoadingWhenReady(workspace, session);

            this.appService.cleanCredentialFile();
            observer.next(false);
            observer.complete();
          });
      };

      processData(params);
    }
  }

  // TODO: move to AwsCredentialsGenerationService
  private getTrusterAccountSessionToken(awsCredentials: AwsCredentials, parentSession, session): Observable<any> {
    return new Observable<AwsCredentials>((observable) => {
      const workspace = this.configurationService.getDefaultWorkspaceSync();

      const processData = (data, err) => {
        if (data !== undefined && data !== null) {
          observable.next(data);
          observable.complete();
        } else {
          this.appService.logger('Error in get session token', LoggerLevel.ERROR, this, err.stack);
          observable.error(err);
          observable.complete();
          // Emit ko for double jump
          this.workspaceService.credentialEmit.emit({status: err.stack, accountName: parentSession.account.accountName});
        }
      };

      AWS.config.update({
        accessKeyId: awsCredentials.default.aws_access_key_id,
        secretAccessKey: awsCredentials.default.aws_secret_access_key
      });

      const sts = new AWS.STS(this.appService.stsOptions(session));
      const params = { DurationSeconds: environment.sessionTokenDuration };

      this.keychainService.getSecret(environment.appName, this.generateTrusterAccountSessionTokenExpirationString(session)).then(sessionTokenExpirationData => {
        if (sessionTokenExpirationData && this.isSessionTokenStillValid(sessionTokenExpirationData)) {
          this.keychainService.getSecret(environment.appName, this.generateTrusterAccountSessionTokenString(session)).then(sessionTokenData => {
            sessionTokenData = JSON.parse(sessionTokenData);
            processData(sessionTokenData, null);
          });
        } else {
          if (this.checkIfMfaIsNeeded(parentSession)) {
            // We Need a MFA BUT Now we need to retrieve a refresh token
            // from the vault to see if the session is still refreshable
            this.showMFAWindowAndAuthenticate(params, parentSession, null, () => {
              sts.getSessionToken(params, (err, data) => {
                let tmpCredentials = null;

                if (data !== undefined && data !== null) {
                  tmpCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, parentSession.account.region, session);
                  this.keychainService.saveSecret(environment.appName, `truster-account-session-token-${session.account.accountName}`, JSON.stringify(tmpCredentials));
                  this.saveTrusterAccountSessionTokenExpirationInVault(tmpCredentials, session);
                }

                processData(tmpCredentials, err);
              });
            });
          } else {
            sts.getSessionToken(params, (err, data) => {
              let tmpCredentials = null;

              if (data !== undefined && data !== null) {
                tmpCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.region, session);
                this.keychainService.saveSecret(environment.appName, `truster-account-session-token-${session.account.accountName}`, JSON.stringify(tmpCredentials));
                this.saveTrusterAccountSessionTokenExpirationInVault(tmpCredentials, session);
              }

              processData(tmpCredentials, err);
            });
          }
        }
      });
    });
  }

  private checkIfMfaIsNeeded(session: Session): boolean {
    return (session.account as AwsPlainAccount).mfaDevice !== undefined &&
      (session.account as AwsPlainAccount).mfaDevice !== null &&
      (session.account as AwsPlainAccount).mfaDevice !== '';
  }

  private showMFAWindowAndAuthenticate(params, session, parentSession, callback) {
    this.appService.inputDialog('MFA Code insert', 'Insert MFA Code', 'please insert MFA code from your app or device', (value) => {
      if (value !== constants.CONFIRM_CLOSED) {
        params['SerialNumber'] = session.account.mfaDevice || (parentSession !== null && parentSession.account.mfaDevice);
        params['TokenCode'] = value;
        callback();
      } else {
        const workspace = this.configurationService.getDefaultWorkspaceSync();
        workspace.sessions.forEach(sess => {
          if (sess.id === session.id) {
            sess.active = false;
            sess.loading = false;
            sess.complete = false;
          }
        });
        this.configurationService.updateWorkspaceSync(workspace);
        this.appService.redrawList.emit(true);
      }
    });
  }

  private savePlainAccountSessionTokenExpirationInVault(credentials, session: Session) {
    const name = this.configurationService.getNameFromProfileId(session.profile);
    this.keychainService.saveSecret(environment.appName, this.generatePlainAccountSessionTokenExpirationString(session), credentials[name].expiration.toString());
  }

  private saveTrusterAccountSessionTokenExpirationInVault(credentials, session: Session) {
    const name = this.configurationService.getNameFromProfileId(session.profile);
    this.keychainService.saveSecret(environment.appName, this.generateTrusterAccountSessionTokenExpirationString(session), credentials[name].expiration.toString());
  }

  private isSessionTokenStillValid(sessionTokenData): boolean {
    const tokenDate = new Date(sessionTokenData);
    const check = (date) => date > Date.now();
    return check(tokenDate);
  }

  private generatePlainAccountSessionTokenExpirationString(session: any) {
    return 'plain-account-session-token-expiration-' + session.account.accountName;
  }

  private generateTrusterAccountSessionTokenExpirationString(session: any) {
    return 'truster-account-session-token-expiration-' + session.account.accountName;
  }

  private generateTrusterAccountSessionTokenString(session: any) {
    return 'truster-account-session-token-' + session.account.accountName;
  }

  private applyPlainAccountSessionToken(workspace, session: Session) {
    this.keychainService.getSecret(environment.appName, `plain-account-session-token-${session.account.accountName}`).then(sessionToken => {
      sessionToken = JSON.parse(sessionToken);
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), sessionToken);
      this.configurationService.updateWorkspaceSync(workspace);
      this.configurationService.disableLoadingWhenReady(workspace, session);
    });
  }

  private applyTrusterAccountSessionToken(workspace, session: Session) {
    this.keychainService.getSecret(environment.appName, `truster-account-session-token-${session.account.accountName}`).then(sessionToken => {
      sessionToken = JSON.parse(sessionToken);
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), sessionToken);
      this.configurationService.updateWorkspaceSync(workspace);
      this.configurationService.disableLoadingWhenReady(workspace, session);
    });
  }

  private doubleJumpFromFixedCredentialWithObserver(session: any): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.doubleJumpFromFixedCredential(observer, session);
    });
  }
}
