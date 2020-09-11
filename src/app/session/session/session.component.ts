import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {HttpClient} from '@angular/common/http';
import {SessionObject} from '../../models/sessionData';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {SsmService} from '../../services/ssm.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {FileService} from '../../services-system/file.service';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';
import {AzureAccountService} from '../../services/azure-account.service';
import {FederatedAccountService} from '../../services/federated-account.service';
import {TrusterAccountService} from '../../services/truster-account.service';
import {MenuService} from '../../services/menu.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent extends AntiMemLeak implements OnInit, OnDestroy {

  // Session Data
  activeSessions: SessionObject[] = [];
  notActiveSessions: SessionObject[] = [];


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
  allSessions;
  retries = 0;
  showOnly = 'ALL';

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
    private sessionService: SessionService,
    private azureAccountService: AzureAccountService,
    private fedAccountService: FederatedAccountService,
    private trusterAccountService: TrusterAccountService,
    private menuService: MenuService
  ) { super(); }

  ngOnInit() {
    // Set retries
    this.retries = 0;

    // retrieve Active and not active sessions
    this.getSessions();

    // Set regions for ssm
    this.ssmRegions = this.appService.getRegions(false);

    // automatically check if there is an active session and get session list again
    this.credentialsService.refreshCredentialsEmit.emit(null);

    // Set loading to false when a credential is emitted: if result is false stop the current session!
    this.credentialsService.refreshReturnStatusEmit.subscribe((res) => {
      if (!res) {
        // problem: stop session now!
        this.stopSession(null);
      }
    });

    this.menuService.redrawList.subscribe(r => {
      this.getSessions();
    });
  }


  /**
   * Stop the current session, setting it to false and updating the workspace
   */
  stopSession(session: SessionObject) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.currentSessionList;
    sessions.map(sess => {
      if (
          session === null ||
          (session.accountData.subscriptionId === sess.accountData.subscriptionId) ||
          (session.accountData.accountNumber === sess.accountData.accountNumber && session.roleData.name === sess.roleData.name)
      ) {
        sess.active = false;
      }
    });
    workspace.currentSessionList = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return true;
  }


  /**
   * getSession
   */
  getSessions() {
    this.activeSessions = this.sessionService.listSessions().filter( session => session.active === true);
    this.notActiveSessions = this.sessionService.listSessions().filter( session => session.active === false);
  }



  /**
   * Go to Account Management
   */
  createAccount() {
    // Go!
    this.router.navigate(['/managing', 'create-account']);
  }

  /**
   * Prepare the data for selection
   */
  refreshRoleMapping(template) {

    this.currentSelectedRole = null;
    // Do it now: refresh role mapping!
    this.refreshRoleMappingOperation();
    this.currentSelectedColor = 0;
    this.modalRef = this.modalService.show(template);
    this.isGettingConf = false;
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

  filterSessions(query) {
    console.log('kjk', query.value);
    this.getSessions();
    if (query.value !== '') {
      this.activeSessions = this.activeSessions.filter(s => s.accountData.accountName.indexOf(query.value) > -1);
      this.notActiveSessions = this.notActiveSessions.filter(s => s.accountData.accountName.indexOf(query.value) > -1);
    }
  }

  setVisibility(name) {
    if (this.showOnly === name) {
      this.showOnly = 'ALL';
    } else {
      this.showOnly = name;
    }
    console.log(this.showOnly);
  }
}
