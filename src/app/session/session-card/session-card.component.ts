import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
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
import {environment} from '../../../environments/environment';
import {KeychainService} from '../../services-system/keychain.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {AwsSsoAccount} from '../../models/aws-sso-account';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss'],
})

export class SessionCardComponent extends AntiMemLeak implements OnInit {

  eAccountType = AccountType;

  @ViewChild('ssmModalTemplate', { static: false })
  ssmModalTemplate: TemplateRef<any>;
  @ViewChild('defaultRegionModalTemplate', { static: false })
  defaultRegionModalTemplate: TemplateRef<any>;
  modalRef: BsModalRef;

  @Input() session: Session;
  @Output() sessionsChanged = new EventEmitter();

  // Ssm instances
  ssmloading = true;
  selectedSsmRegion;
  selectedDefaultRegion;
  openSsm = false;
  awsRegions = [];
  regionOrLocations = [];
  instances = [];
  sessionDetailToShow;
  placeholder;

  constructor(private sessionService: SessionService,
              private credentialsService: CredentialsService,
              private workspaceService: WorkspaceService,
              private keychainService: KeychainService,
              private menuService: MenuService,
              private appService: AppService,
              private router: Router,
              private trusterAccountService: TrusterAccountService,
              private federatedAccountService: FederatedAccountService,
              private azureAccountService: AzureAccountService,
              private configurationService: ConfigurationService,
              private ssmService: SsmService,
              private modalService: BsModalService) { super(); }

  ngOnInit() {
    // Set regions for ssm and for default region, same with locations,
    // add the correct placeholder to the select
    this.awsRegions = this.appService.getRegions();
    const azureLocations = this.appService.getLocations();
    this.regionOrLocations = this.session.account.type !== AccountType.AZURE ? this.awsRegions : azureLocations;
    this.placeholder = this.session.account.type !== AccountType.AZURE ? 'Select a default region' : 'Select a default location';
    this.selectedDefaultRegion = this.session.account.region;

    switch (this.session.account.type) {
      case(AccountType.AWS):
        this.sessionDetailToShow = (this.session.account as AwsAccount).role.name;
        break;
      case(AccountType.AZURE):
        this.sessionDetailToShow = (this.session.account as AzureAccount).subscriptionId;
        break;
      case(AccountType.AWS_PLAIN_USER):
        this.sessionDetailToShow = (this.session.account as AwsPlainAccount).user;
        break;
      case(AccountType.AWS_SSO):
        this.sessionDetailToShow = (this.session.account as AwsSsoAccount).role.name;
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
        const sessionAccount = (session.account as AwsAccount);
        const texts = {
          1: sessionAccount.accountNumber,
          2: sessionAccount.role ? `arn:aws:iam::${(session.account as AwsAccount).accountNumber}:role/${(session.account as AwsAccount).role.name}` : ''
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
   * @param event - event
   */
  ssmModalOpen(session, event) {
    // Reset things before opening the modal
    this.instances = [];
    this.ssmloading = false;
    this.modalRef = this.modalService.show(this.ssmModalTemplate, { class: 'ssm-modal'});
  }

  /**
   * SSM Modal open given the correct session
   * @param session - the session to check for possible ssm sessions
   * @param event - event
   */
  changeRegionModalOpen(session, event) {
    // open the modal

    this.modalRef = this.modalService.show(this.defaultRegionModalTemplate, { class: 'ssm-modal'});
  }

  /**
   * Set the region for ssm init and launch the mopethod form the server to find instances
   * @param event - the change select event
   */
  changeSsmRegion(event) {
    if (this.selectedSsmRegion) {
      this.ssmloading = true;
      // Set the aws credentials to instanziate the ssm client
      this.keychainService.getSecret(environment.appName, `Leapp-ssm-data`).then(creds => {
        const credentials = JSON.parse(creds);

        // Check the result of the call
        this.subs.add(this.ssmService.setInfo(credentials, this.selectedSsmRegion).subscribe(result => {
          this.instances = result.instances;
          this.ssmloading = false;
        }, _ => {
          this.instances = [];
          this.ssmloading = false;
        }));
      });

    }
  }

  /**
   * Set the region for the session
   * @param event - the change select event
   */
  changeDefaultRegion(event) {
    if (this.selectedDefaultRegion) {
      const workspace = this.configurationService.getDefaultWorkspaceSync();
      workspace.sessions.forEach(session => {
        if (session.id === this.session.id) {
          session.account.region = this.selectedDefaultRegion;
          this.session.account.region = this.selectedDefaultRegion;
          this.configurationService.updateWorkspaceSync(workspace);

          if (this.session.active) {
            this.startSession(this.session);
          }
        }
      });
      this.appService.toast('Default region has been changed!', ToastLevel.SUCCESS, 'Region changed!');
      this.modalRef.hide();

    }
  }

  /**
   * Start a new ssm session
   * @param instanceId - instance id to start ssm session
   */
  startSsmSession(instanceId) {
    this.instances.forEach(instance => { if (instance.InstanceId === instanceId) { instance.loading = true; } });

    this.ssmService.startSession(instanceId, this.selectedSsmRegion);

    setTimeout(() => {
      this.instances.forEach(instance => { if (instance.InstanceId === instanceId) { instance.loading = false; } });
    }, 4000);

    this.openSsm = false;
    this.ssmloading = false;
  }
}
