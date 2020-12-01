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

import {AwsCredential} from '../models/credential';
import {ConfigurationService} from '../services-system/configuration.service';
import {environment} from '../../environments/environment';
import {KeychainService} from '../services-system/keychain.service';


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
    ).subscribe((getRoleCredentialsResponse) => {
      // Construct the credential object
      const credential: AwsCredential = {};
      credential.aws_access_key_id = getRoleCredentialsResponse.roleCredentials.accessKeyId;
      credential.aws_secret_access_key = getRoleCredentialsResponse.roleCredentials.secretAccessKey;
      credential.aws_session_token = getRoleCredentialsResponse.roleCredentials.sessionToken;
      const awsSsoCredentials = {default: credential};
      session.active = true;
      session.loading = false;
      this.keychainService.saveSecret(environment.appName, `Leapp-ssm-data`, JSON.stringify(credential));
      this.configurationService.disableLoadingWhenReady(workspace, session);
      this.fileService.iniWriteSync(this.appService.awsCredentialPath(), awsSsoCredentials);
    });
  }
}
