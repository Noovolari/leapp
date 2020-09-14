import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SessionObject} from '../../models/sessionData';
import {SessionService} from '../../services/session.service';
import {CredentialsService} from '../../services/credentials.service';
import {MenuService} from '../../services/menu.service';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {Router} from '@angular/router';
import {TrusterAccountService} from '../../services/truster-account.service';
import {FederatedAccountService} from '../../services/federated-account.service';
import {AzureAccountService} from '../../services/azure-account.service';
import {ConfigurationService} from '../../services-system/configuration.service';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss']
})


export class SessionCardComponent implements OnInit {

  @Input() session: SessionObject;
  @Output() sessionsChanged = new EventEmitter();

  constructor(private sessionService: SessionService,
              private credentialsService: CredentialsService,
              private menuService: MenuService,
              private appService: AppService,
              private router: Router,
              private trusterAccountService: TrusterAccountService,
              private federatedAccountService: FederatedAccountService,
              private azureAccountService: AzureAccountService,
              private configurationService: ConfigurationService) { }

  ngOnInit() {

  }


  /**
   * Start the selected session
   * @param session - {SessionObject} - the session object we want to login to
   */
  startSession(session: SessionObject) {

    // Start a new session with the selected one
    this.sessionService.startSession(session);

    // automatically check if there is an active session and get session list again
    this.credentialsService.refreshCredentialsEmit.emit(!this.appService.isAzure(session));

    this.sessionsChanged.emit('');
    this.menuService.redrawList.emit(true);
  }

  /**
   * Stop session
   */
  stopSession(session: SessionObject) {
    // Eventually close the tray
    this.sessionService.stopSession(session);
    // TODO refactor this.openSsm = false;

    // automatically check if there is an active session or stop it
    this.credentialsService.refreshCredentialsEmit.emit(!this.appService.isAzure(session));
    this.sessionsChanged.emit('');
    this.menuService.redrawList.emit(true);
  }


  removeAccount(session) {
    this.appService.confirmDialog('do you really want to delete this account?', () => {
      if (session.accountData.accountNumber) {
        this.trusterAccountService.deleteTrusterAccount(session.accountData.accountNumber, session.roleData.name);
        this.federatedAccountService.deleteFederatedAccount(session.accountData.accountNumber, session.roleData.name);
      } else {
        this.azureAccountService.deleteAzureAccount(session.accountData.subscriptionId);
      }

      this.sessionsChanged.emit();
      this.sessionService.deleteSessionFromWorkspace(session);
      this.sessionService.listSessions();
    });
  }

  /**
   * Copy credentials in the clipboard
   */
  copyCredentials(session: SessionObject, type: number) {
    try {

      const workspace = this.configurationService.getDefaultWorkspaceSync();
      if (workspace) {
        const awsCredentials = workspace.awsCredentials;

        const texts = {
          1: (awsCredentials ? awsCredentials['default'].aws_access_key_id : 'not set yet'),
          2: (awsCredentials ? awsCredentials['default'].aws_secret_access_key : 'not set yet'),
          3: session.accountData.accountNumber,
          4: `arn:aws:iam::${session.accountData.accountNumber}:role/${session.roleData.name}`
        };

        const text = texts[type];

        this.appService.copyToClipboard(text);
        this.appService.toast('Your information have been successfully copied!', ToastLevel.SUCCESS, 'Information copied!');
      }
    } catch (err) {
      this.appService.toast(err, ToastLevel.WARN);
      this.appService.logger(err, LoggerLevel.WARN);
    }
  }

  switchCredentials() {
    if (this.session.active) {
      this.stopSession(this.session);
    } else {
      this.startSession(this.session);
    }
  }

  openDropDown(event) {
    console.log('dropdown')
    event.stopPropagation();
  }
}
