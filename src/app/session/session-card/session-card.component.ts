import {Component, EventEmitter, Host, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {Session} from '../../models/session';
import {SessionService} from '../../services/session.service';
import {CredentialsService} from '../../services/credentials.service';
import {MenuService} from '../../services/menu.service';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {Router} from '@angular/router';
import {TrusterAccountService} from '../../services/truster-account.service';
import {FederatedAccountService} from '../../services/federated-account.service';
import {AzureAccountService} from '../../services/azure-account.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AwsAccount} from '../../models/aws-account';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {SsmService} from '../../services/ssm.service';
import {AzureAccount} from '../../models/azure-account';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {AccountType} from '../../models/AccountType';
import {WorkspaceService} from '../../services/workspace.service';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss'],
})

export class SessionCardComponent implements OnInit {

  eAccountType = AccountType;

  @ViewChild('ssmModalTemplate', { static: false })
  ssmModalTemplate: TemplateRef<any>;
  modalRef: BsModalRef;

  @Input() session: Session;
  @Output() sessionsChanged = new EventEmitter();

  // Ssm instances
  ssmloading = true;
  selectedSsmRegion;
  openSsm = false;
  ssmRegions = [];
  instances = [];
  sessionDetailToShow;

  constructor(private sessionService: SessionService,
              private credentialsService: CredentialsService,
              private workspaceService: WorkspaceService,
              private menuService: MenuService,
              private appService: AppService,
              private router: Router,
              private trusterAccountService: TrusterAccountService,
              private federatedAccountService: FederatedAccountService,
              private azureAccountService: AzureAccountService,
              private configurationService: ConfigurationService,
              private ssmService: SsmService,
              private modalService: BsModalService) { }

  ngOnInit() {
    // Set regions for ssm
    this.ssmRegions = this.appService.getRegions(false);
    let nameToShow;
    switch (this.session.account.type) {
      case(AccountType.AWS):
        nameToShow = (this.session.account as AwsAccount).role.name.length >= 13 ? `${(this.session.account as AwsAccount).role.name.substr(0, 13)}...` : (this.session.account as AwsAccount).role.name;
        this.sessionDetailToShow = nameToShow;
        break;
      case(AccountType.AZURE):
        nameToShow = (this.session.account as AzureAccount).subscriptionId.length >= 13 ? `${(this.session.account as AzureAccount).subscriptionId.substr(0, 13)}...` : (this.session.account as AzureAccount).subscriptionId;
        this.sessionDetailToShow = nameToShow;
        break;
      case(AccountType.AWS_PLAIN_USER):
        nameToShow = (this.session.account as AwsPlainAccount).user.length >= 13 ? `${(this.session.account as AwsPlainAccount).user.substr(0, 13)}...` : (this.session.account as AwsPlainAccount).user;
        this.sessionDetailToShow = nameToShow;
        break;
    }
  }

  /**
   * Start the selected session
   * @param session - {SessionObject} - the session object we want to login to
   */
  startSession(session: Session) {
    // Start a new session with the selected one
    this.sessionService.startSession(session);

    // automatically check if there is an active session and get session list again
    this.credentialsService.refreshCredentialsEmit.emit(session.account.type);

    this.appService.logger(`Starting Session`, LoggerLevel.INFO, this, JSON.stringify({ timestamp: new Date().toISOString(), id: this.session.id, account: this.session.account.accountName, type: this.session.account.type }, null, 3));
    // Redraw the list
    this.sessionsChanged.emit('');
    this.appService.redrawList.emit(true);
  }

  /**
   * Stop session
   */
  stopSession(session: Session) {
    // Eventually close the tray
    this.sessionService.stopSession(session);
    // TODO refactor this.openSsm = false;

    // automatically check if there is an active session or stop it
    this.credentialsService.refreshCredentialsEmit.emit(session.account.type);
    this.sessionsChanged.emit('');
    this.appService.redrawList.emit(true);
    this.appService.logger('Session Stopped', LoggerLevel.INFO, this, JSON.stringify({ timespan: new Date().toISOString(), id: this.session.id, account: this.session.account.accountName, type: this.session.account.type }, null, 3));
  }

  removeAccount(session, event) {
    event.stopPropagation();
    this.appService.confirmDialog('do you really want to delete this account?', () => {
      this.federatedAccountService.cleanKeychainIfNecessary(session);
      this.sessionService.removeSession(session);
      this.sessionsChanged.emit('');
      this.appService.logger('Session Removed', LoggerLevel.INFO, this, JSON.stringify({ timespan: new Date().toISOString(), id: session.id, account: session.account.accountName, type: session.account.type }, null, 3));
      this.appService.redrawList.emit(true);
    });
  }

  editAccount(session, event) {
    event.stopPropagation();
    this.router.navigate(['/managing', 'edit-account'], {queryParams: { sessionId: session.id }});
  }

  /**
   * Copy credentials in the clipboard
   */
  copyCredentials(session: Session, type: number, event) {
    this.openDropDown(event);
    try {
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      if (workspace) {
        const texts = {
          1: (session.account as AwsAccount).accountNumber,
          2: `arn:aws:iam::${(session.account as AwsAccount).accountNumber}:role/${(session.account as AwsAccount).role.name}`
        };

        const text = texts[type];

        this.appService.copyToClipboard(text);
        this.appService.toast('Your information have been successfully copied!', ToastLevel.SUCCESS, 'Information copied!');
      }
    } catch (err) {
      this.appService.toast(err, ToastLevel.WARN);
      this.appService.logger(err, LoggerLevel.ERROR, this, err.stack);
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
    event.stopPropagation();
  }

  // ============================== //
  // ========== SSM AREA ========== //
  // ============================== //

  /**
   * SSM Modal open given the correct session
   * @param session - the session to check for possible ssm sessions
   */
  ssmModalOpen(session, event) {
    // Reset things before opening the modal
    this.instances = [];
    this.ssmloading = false;
    this.modalRef = this.modalService.show(this.ssmModalTemplate, { class: 'ssm-modal'});
  }

  /**
   * Set the region for ssm init and launch the mopethod form the server to find instances
   * @param event - the change select event
   */
  changeSsmRegion(event) {
    console.log('Calling change SSM region');

    if (this.selectedSsmRegion) {
      this.ssmloading = true;
      // Set the aws credentials to instanziate the ssm client
      const credentials = this.configurationService.getDefaultWorkspaceSync().ssmCredentials;

      // Check the result of the call
      this.ssmService.setInfo(credentials, this.selectedSsmRegion).subscribe(result => {
        this.instances = result.instances;
        this.ssmloading = false;
      });

    }
  }

  /**
   * Start a new ssm session
   * @param instanceId - instance id to start ssm session
   */
  startSsmSession(instanceId) {
    this.ssmService.startSession(instanceId);
    this.openSsm = false;
    this.ssmloading = false;
  }
}
