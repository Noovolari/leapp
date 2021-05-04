import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService} from '../../services/app.service';
import {HttpClient} from '@angular/common/http';
import {Session} from '../../models/session';
import {SsmService} from '../../services/ssm.service';
import {FileService} from '../../services/file.service';
import {SessionService} from '../../services/session.service';
import {AwsAccount} from '../../models/aws-account';
import {AzureAccount} from '../../models/azure-account';
import {BsModalService} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {

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
  showOnly = 'ALL';

  workspace;
  subscription;

  @ViewChild('filterField', { static: false})
  filterField: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private httpClient: HttpClient,
    private modalService: BsModalService,
    private appService: AppService,
    private ssmService: SsmService,
    private fileService: FileService,
    private sessionService: SessionService,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    // retrieve Active and not active sessions
    this.refresh();

    // Set regions for ssm
    this.ssmRegions = this.appService.getRegions();

    // Set loading to false when a credential is emitted: if result is false stop the current session!
    this.appService.refreshReturnStatusEmit.subscribe((res) => {
      if (res !== true) {
        // problem: stop session now!
        this.stopSession(res);
      }
    });
  }

  /**
   * getSession
   */
  refresh() {
    this.zone.run(() => {
      this.activeSessions = this.sessionService.list().filter( session => session.active === true);
      // @ts-ignore
      this.notActiveSessions = this.sessionService.alterOrderByTime(this.sessionService.list().filter( session => session.active === false));
      if (this.filterField) {
        this.filterInactiveSessions(this.filterField.nativeElement.value);
      }
    });
  }

  /**
   * Stop the current session, setting it to false and updating the workspace
   */
  stopSession(session: Session) {
    this.sessionService.stop(session.sessionId);
    this.refresh();
    return true;
  }

  /**
   * Go to Account Management
   */
  createAccount() {
    // Go!
    this.router.navigate(['/managing', 'create-account']);
  }

  filterSessions(query) {
    this.refresh();
    this.filterInactiveSessions(query);
  }

  filterInactiveSessions(query) {
    if (query !== '') {
      this.notActiveSessions = this.notActiveSessions.filter(s => {
        const idpID = this.workspace.idpUrl.filter(idp => idp && idp.url.toLowerCase().indexOf(query.toLowerCase()) > -1).map(m => m.id);
        return s.account.accountName.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
          ((s.account as AwsAccount).role && (s.account as AwsAccount).role.name.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AwsAccount).accountNumber && (s.account as AwsAccount).accountNumber.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (this.getProfileName(s.profileId).toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (idpID.indexOf((s.account as AwsAccount).idpUrl) > -1) ||
          // ((s.account as AwsPlainAccount).user && (s.account as AwsPlainAccount).user.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AzureAccount).tenantId && (s.account as AzureAccount).tenantId.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AzureAccount).subscriptionId && (s.account as AzureAccount).subscriptionId.toLowerCase().indexOf(query.toLowerCase()) > -1);
      });
    }
  }

  getProfileName(profileId: string): string {
    const workspace = this.workspaceService.get();
    let profileName = '';
    for (let i = 0; i < workspace.profiles.length; i++) {
      if (workspace.profiles[i].id === profileId) {
        profileName = workspace.profiles[i].name;
        break;
      }
    }

    return profileName;
  }

  setVisibility(name) {
    if (this.showOnly === name) {
      this.showOnly = 'ALL';
    } else {
      this.showOnly = name;
    }
  }
}
