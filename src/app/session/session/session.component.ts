import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {HttpClient} from '@angular/common/http';
import {SessionObject} from '../../models/sessionData';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {SsmService} from '../../services/ssm.service';
import {environment} from '../../../environments/environment';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {FileService} from '../../services-system/file.service';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent extends AntiMemLeak implements OnInit, OnDestroy {

  // tell us if we are in lite client mode or not
  liteClient = environment.liteClient;

  // Session Data
  sessions: SessionObject[] = [];

  selectedToRemove = null;
  loading = false;
  isGettingConf = false;

  // Modal Reference and data
  modalRef: BsModalRef;

  // Data for the select
  modalAccounts = [];
  modalRoles = [];
  currentSelectedColor;
  currentSelectedAccountNumber;
  currentSelectedRole;

  // Ssm instances
  ssmloading = true;
  selectedSsmRegion;
  openSsm = false;
  ssmRegions = [];
  instances = [];

  // Connection retries
  retries = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private httpClient: HttpClient,
    private modalService: BsModalService,
    private appService: AppService,
    private ssmService: SsmService,
    private fileService: FileService,
    private credentialsService: CredentialsService,
    private sessionService: SessionService
  ) { super(); }

  ngOnInit() {
    // Set retries
    this.retries = 0;

    // Set regions for ssm
    this.ssmRegions = this.appService.getRegions(false);

    // Get all saved sessions
    this.sessions = this.sessionService.listSessions();

    // automatically check if there is an active session and get session list again
    this.credentialsService.refreshCredentialsEmit.emit();

    // Set loading to false when a credential is emitted: if result is false stop the current session!
    this.credentialsService.refreshReturnStatusEmit.subscribe((res) => {
      this.loading = false;
      if (!res) {
        // problem: stop session now!
        this.stopSession();
      }
    });

  }

  /**
   * Remove the current Session Object form the visualized list
   * @param session - SessionObject
   */
  removeSession(session) {
    this.sessionService.removeSession(session);
    this.sessions = this.sessionService.listSessions();
  }


  /**
   * Start the selected session
   * @param session - {SessionObject} - the session object we want to login to
   */
  startSession(session: SessionObject) {

    // Start a new session with the selected one
    this.sessionService.startSession(session);
    this.loading = true;

    // automatically check if there is an active session and get session list again
    this.credentialsService.refreshCredentialsEmit.emit();
    this.sessions = this.sessionService.listSessions();
  }

  /**
   * Stop session
   */
  stopSession() {
    // Eventually close the tray
    this.sessionService.stopSession();
    this.openSsm = false;

    // automatically check if there is an active session or stop it
    this.credentialsService.refreshCredentialsEmit.emit();
    this.sessions = this.sessionService.listSessions();
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

  /**
   * Go to Account Management
   */
  gotToAccountManagement() {
    // Go!
    this.router.navigate(['/sessions', 'list-accounts']);
  }

  /**
   * Retrieve the remote configuration if we are in pro mode
   */
  getConfigurationIfPro(template) {
    const sub = this.workspaceService.getConfiguration().subscribe(() => {
      // We got all the new configuration elements, proceed to remove or update all the elements
      this.sessions = this.sessionService.listSessions();

      this.refreshRoleMappingOperation();
      this.currentSelectedColor = 0;
      this.modalRef = this.modalService.show(template);
      this.isGettingConf = false;
    }, err => {
      this.appService.toast(err, ToastLevel.WARN, 'Unable to retrieve remote configuration');
      this.isGettingConf = false;
    });

    this.subs.add(sub);
  }

  /**
   * Prepare the data for selection
   */
  refreshRoleMapping(template) {

    this.currentSelectedRole = null;

    // If we are in pro mode we call the get configuration here to update the default workspace
    if (!this.liteClient) {
      this.getConfigurationIfPro(template);
    } else {
      // Do it now!
      this.refreshRoleMappingOperation();
      this.currentSelectedColor = 0;
      this.modalRef = this.modalService.show(template);
      this.isGettingConf = false;
    }
  }

  /**
   * The actual mapping operation, we have moved it here to allow code reusing in both method above
   */
  refreshRoleMappingOperation() {
    this.modalAccounts = this.sessionService.actionableSessions();
    if (this.modalAccounts.length > 0) {
      this.currentSelectedAccountNumber = this.modalAccounts[0].accountNumber;
      this.changeRoles({});
    }
  }

  /**
   * Set the roles to select
   * @param event - the change event, not used
   */
  changeRoles(event) {

    const account = this.modalAccounts.filter(el => el.accountNumber === this.currentSelectedAccountNumber)[0];
    this.modalRoles = account ? account.awsRoles : [];

    if (this.modalRoles && this.modalRoles.length > 0) {
      this.currentSelectedRole = this.modalRoles[0].name;
    } else  {
      this.currentSelectedRole = null;
      this.appService.toast('Please create a role for this account.', ToastLevel.WARN, 'No roles for this account');
    }
  }

  /**
   * Set the region for ssm init and launch the mopethod form the server to find instances
   * @param event - the change select event
   */
  changeSsmRegion(event) {
    if (this.selectedSsmRegion) {
      this.ssmloading = true;
      // Set the aws credentials to instanziate the ssm client
      const credentials = this.configurationService.getDefaultWorkspaceSync().awsCredentials;
      // Check the result of the call
      const sub = this.ssmService.setInfo(credentials, this.selectedSsmRegion).subscribe(result => {

        // console.log(result);

        this.instances = result.instances;
        this.ssmloading = false;
      });

      this.subs.add(sub);
    }
  }

  /**
   * Open Add Account Modal
   * @param template - the template to use
   */
  showAddAccountModal(template) {

    // clear modal roles for a new call
    this.modalRoles = [];

    // We check some parameters for good sake of the layout: we don't want to allow more than 4 sessions in the quick list
    if (this.sessions.length < 5) {
      // Refresh the account/role mapping and show the modal
      if (!this.isGettingConf) {
        this.isGettingConf = true;
        this.refreshRoleMapping(template);
      }
    }
  }

  /**
   * Set the current color for the Add Account Method below
   * @param colorNumber - the number representing the different background styles
   */
  setBackgroundColor(colorNumber) {
    this.currentSelectedColor = colorNumber;
  }

  /**
   * Retry a random color until we get one
   * @returns - {any} - the value
   */
  retryRandomColor() {
    let value = Math.floor(Math.random() * 8 + 1);
    while (this.checkIFColorIsOccupied(value)) {
      value = Math.floor(Math.random() * 8 + 1);
    }
    return value;
  }

  /**
   * Add a new Account to the quick list
   */
  addAccount() {
    // Add a session
    this.sessionService.addSession(
      this.currentSelectedAccountNumber,
      this.currentSelectedRole,
      `background-${this.currentSelectedColor > 0 ? this.currentSelectedColor : this.retryRandomColor()}`,
      false);

    // Refresh the sessions
    this.sessions = this.sessionService.listSessions();

    // Close the modal
    this.modalRef.hide();
  }

  /**
   * Open the tray behind the active card
   * @param event - click event, we prevent propagation because we also check for the click behind
   */
  openSsmTray(event) {
    // Prevent event bubbling on document to avoid the tray keep opening and closing
    if (event) {
      event.stopPropagation();
    }

    // Set some parameters for the modal
    this.openSsm = true;
    this.selectedSsmRegion = this.ssmRegions[1];
    this.instances = [];
    this.ssmloading = true;
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

  /**
   * Check if the color is already used
   * @param num - the num to check
   * @returns - {boolean}
   */
  checkIFColorIsOccupied(num) {
    let toCheck = false;
    this.sessions.forEach(session => {
      toCheck = toCheck || (session.color === ('background-' + num));
    });
    return toCheck;
  }
}
