import {Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {MenuService} from '../../services/menu.service';
import {AwsAccount} from '../../models/aws-account';
import {AzureAccount} from '../../models/azure-account';
import {AwsPlainAccount} from '../../models/aws-plain-account';

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
  currentSelectedColor;
  currentSelectedAccountNumber;

  // Ssm instances
  ssmloading = true;
  ssmRegions = [];
  instances = [];

  // Connection retries
  allSessions;
  retries = 0;
  showOnly = 'ALL';

  workspace;

  @ViewChild('filterField', { static: false})
  filterField: ElementRef;

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
    private menuService: MenuService,
    private zone: NgZone
  ) { super(); }

  ngOnInit() {
    // Set workspace
    this.workspace = this.configurationService.getDefaultWorkspaceSync();

    // Set retries
    this.retries = 0;
    // retrieve Active and not active sessions
    this.getSessions();

    // Set regions for ssm
    this.ssmRegions = this.appService.getRegions();

    // Set loading to false when a credential is emitted: if result is false stop the current session!
    this.subs.add(this.credentialsService.refreshReturnStatusEmit.subscribe((res) => {
      if (!res) {
        // problem: stop session now!
        this.stopSession(null);
      }
    }));

    this.subs.add(this.appService.redrawList.subscribe(() => {
      this.getSessions();
    }));
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
        sess.loading = false;
      }
    });

    this.activeSessions = [];
    this.notActiveSessions = sessions;

    workspace.sessions = sessions;
    this.configurationService.updateWorkspaceSync(workspace);
    return true;
  }

  /**
   * getSession
   */
  getSessions() {
    this.zone.run(() => {
      this.activeSessions = this.sessionService.listSessions().filter( session => session.active === true);
      this.notActiveSessions = this.sessionService.alterOrderByTime(this.sessionService.listSessions().filter( session => session.active === false));
      if (this.filterField) {
        this.filterInactiveSessions(this.filterField.nativeElement.value);
      }
    });
  }

  /**
   * Go to Account Management
   */
  createAccount() {
    // Go!
    this.router.navigate(['/managing', 'create-account']);
  }

  filterSessions(query) {
    this.getSessions();
    this.filterInactiveSessions(query);
  }

  filterInactiveSessions(query) {
    if (query !== '') {
      this.notActiveSessions = this.notActiveSessions.filter(s => {
        const idpID = this.workspace.idpUrl.filter(idp => idp && idp.url.toLowerCase().indexOf(query.toLowerCase()) > -1).map(m => m.id);
        return s.account.accountName.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
          ((s.account as AwsAccount).role && (s.account as AwsAccount).role.name.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AwsAccount).accountNumber && (s.account as AwsAccount).accountNumber.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (idpID.indexOf((s.account as AwsAccount).idpUrl) > -1) ||
          ((s.account as AwsPlainAccount).user && (s.account as AwsPlainAccount).user.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AzureAccount).tenantId && (s.account as AzureAccount).tenantId.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AzureAccount).subscriptionId && (s.account as AzureAccount).subscriptionId.toLowerCase().indexOf(query.toLowerCase()) > -1);
      });
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
