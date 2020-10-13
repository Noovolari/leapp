import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService} from '../../services-system/app.service';
import {HttpClient} from '@angular/common/http';
import {Session} from '../../models/session';
import {BsModalService} from 'ngx-bootstrap';
import {SsmService} from '../../services/ssm.service';
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

  // Session Data
  activeSessions: Session[] = [];
  notActiveSessions: Session[] = [];

  // Data for the select
  modalAccounts = [];
  modalRoles = [];
  currentSelectedColor;
  currentSelectedAccountNumber;

  // Ssm instances
  ssmloading = true;
  selectedSsmRegion;
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
    private sessionService: SessionService
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

    this.appService.redrawList.subscribe(r => {
      this.getSessions();
    });
  }

  /**
   * Stop the current session, setting it to false and updating the workspace
   */
  stopSession(session: Session) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const sessions = workspace.sessions;
    sessions.map(sess => {
      if (session === null || (session.id === sess.id)) {
        sess.active = false;
      }
    });
    workspace.sessions = sessions;
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

        this.instances = result.instances;
        this.ssmloading = false;
      });

      this.subs.add(sub);
    }
  }

  filterSessions(query) {
    this.getSessions();
    if (query !== '') {
      this.notActiveSessions = this.notActiveSessions.filter(s => s.account.accountName.toLowerCase().indexOf(query.toLowerCase()) > -1);
    }
  }

  setVisibility(name) {
    if (this.showOnly === name) {
      this.showOnly = 'ALL';
    } else {
      this.showOnly = name;
    }
  }
}
