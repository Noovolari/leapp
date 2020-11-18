import {AccountType} from '../models/AccountType';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {AwsCredentials} from '../models/credential';
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
import {Observable} from 'rxjs';
import {constants} from '../core/enums/constants';
import {ProxyService} from '../services/proxy.service';
import {Session} from '../models/session';


// Import AWS node style
const AWS = require('aws-sdk');

export class AwsStrategy extends RefreshCredentialsStrategy {

  constructor(
    private credentialsService: CredentialsService,
    private appService: AppService,
    private configurationService: ConfigurationService,
    private executeService: ExecuteServiceService,
    private fileService: FileService,
    private keychainService: KeychainService,
    private proxyService: ProxyService,
    private timerService: TimerService,
    private workspaceService: WorkspaceService) {
    super();
  }

  getActiveSessions(workspace: Workspace) {
    const activeSessions = workspace.sessions.filter((sess) => {
      return (sess.account.type === AccountType.AWS_PLAIN_USER || sess.account.type === AccountType.AWS) && sess.active;
    });

    this.appService.logger('Aws Active sessions', LoggerLevel.INFO, this, JSON.stringify(activeSessions, null, 3));
    return activeSessions;
  }

  cleanCredentials(workspace: Workspace): void {
    if (workspace) {
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), {});
      this.timerService.clearTimer();
    }
  }

  manageSingleSession(workspace, session) {
    if (session.account.type === AccountType.AWS_PLAIN_USER) {
      this.awsCredentialProcess(workspace, session);
    } else if (session.account.type === AccountType.AWS) {
      this.awsCredentialFederatedProcess(workspace, session);
    }
  }

  /**
   * In this method we transform plain to temporary to avoid saving plain credential in the file
   * @param workspace - the workspace we are working on
   * @param session - the current session we use to retrieve information from
   */
  private async awsCredentialProcess(workspace: Workspace, session) {
    const credentials = await this.getIamUserAccessKeysFromKeychain(session);

    this.keychainService.getSecret(environment.appName, this.generatePlainAccountSessionTokenExpirationString(session)).then(sessionTokenData => {
      if (sessionTokenData && this.isSessionTokenStillValid(sessionTokenData)) {
        this.applyPlainAccountSessionToken(workspace, session);
      } else {
        this.getPlainAccountSessionToken(credentials, session).subscribe((awsCredentials) => {
            const tmpCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(awsCredentials, workspace, session.account.region);

            this.keychainService.saveSecret(environment.appName, `plain-account-session-token-${session.account.accountName}`, JSON.stringify(tmpCredentials));
            this.savePlainAccountSessionTokenExpirationInVault(tmpCredentials, session);

            this.fileService.iniWriteSync(this.appService.awsCredentialPath(), tmpCredentials);
            this.configurationService.disableLoadingWhenReady(workspace, session);
          },
          (err) => {
            this.appService.logger('Error in Aws Credential process', LoggerLevel.ERROR, this, err.stack);
            throw new Error(err);
          });
      }
    });

    // Start Calculating time here once credentials are actually retrieved
    this.timerService.defineTimer();
  }

  awsCredentialFederatedProcess(workspace, session) {
    // Check for Aws Credentials Process
    if (!workspace) {
      return 'workspace not set';
    }

    const idpUrl = workspace.idpUrl ;

    // Enable current active session
    this.fileService.writeFileSync(this.appService.awsCredentialPath(), '');

    try {
      if (this.checkIfFederatedOrTrusterWithSamlFederation(session)) {
        this.workspaceService.refreshCredentials(idpUrl, session);
      } else {
        this.doubleJumpFromFixedCredential(session);
      }
    } catch (e) {
      this.appService.logger('Error in Aws Credential Federated Process', LoggerLevel.ERROR, this, e.stack);
      this.credentialsService.refreshReturnStatusEmit.emit(false);
    }

    // Start Calculating time here once credentials are actually retrieved
    this.timerService.defineTimer();
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

  private checkIfFederatedOrTrusterWithSamlFederation(session) {
    if (session.account.parent === null || session.account.parent === undefined) {
      return true;
    } else if (session.account.parent !== null && session.account.parent !== undefined) {
      // Here we have a truster account now we need to know the nature of the truster account
      const parentAccountSessionId = session.account.parent;
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      const sessions = workspace.sessions;
      const parentAccountList = sessions.filter(sess => sess.id === parentAccountSessionId);

      if (parentAccountList.length > 0) {
        // Parent account found: check its nature
        return parentAccountList[0].account.type === AccountType.AWS;
      }
    }

    return true;
  }

  private async doubleJumpFromFixedCredential(session) {
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

      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentials);

      this.proxyService.configureBrowserWindow(this.appService.currentBrowserWindow());

      const params = {
        RoleArn: `arn:aws:iam::${session.account.accountNumber}:role/${session.account.role.name}`,
        RoleSessionName: `truster-on-${session.account.role.name}`,
        DurationSeconds: 3600 // 1 hour for chained assume role
      };

      const processData = (p) => {
        this.getTrusterAccountSessionToken(credentials, parentSession, session).subscribe((awsCredentials) => {
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
              } else {
                // We set the new credentials after the first jump
                const trusterCredentials: AwsCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.region);

                this.fileService.iniWriteSync(this.appService.awsCredentialPath(), trusterCredentials);

                this.configurationService.updateWorkspaceSync(workspace);
                this.configurationService.disableLoadingWhenReady(workspace, session);

                // Finished double jump
                this.appService.logger('Made it through Double jump from plain', LoggerLevel.INFO, this);
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
          });
      };

      this.keychainService.getSecret(environment.appName, this.generateTrusterAccountSessionTokenExpirationString(session)).then(sessionTokenData => {
        if (sessionTokenData && this.isSessionTokenStillValid(sessionTokenData)) {
          this.applyTrusterAccountSessionToken(workspace, session);
        } else {
          processData(params);
        }
      });
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

      this.keychainService.getSecret(environment.appName, this.generateTrusterAccountSessionTokenExpirationString(parentSession)).then(sessionTokenExpirationData => {
        if (sessionTokenExpirationData && this.isSessionTokenStillValid(sessionTokenExpirationData)) {
          this.keychainService.getSecret(environment.appName, this.generateTrusterAccountSessionTokenString(parentSession)).then(sessionTokenData => {
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
                  tmpCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, parentSession.account.region);
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
                tmpCredentials = this.workspaceService.constructCredentialObjectFromStsResponse(data, workspace, session.account.region);
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
          }
        });
        this.configurationService.disableLoadingWhenReady(workspace, session);
      }
    });
  }

  private savePlainAccountSessionTokenExpirationInVault(credentials, session) {
    this.keychainService.saveSecret(environment.appName, this.generatePlainAccountSessionTokenExpirationString(session), credentials.default.expiration.toString());
  }

  private saveTrusterAccountSessionTokenExpirationInVault(credentials, session) {
    this.keychainService.saveSecret(environment.appName, this.generateTrusterAccountSessionTokenExpirationString(session), credentials.default.expiration.toString());
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
}
