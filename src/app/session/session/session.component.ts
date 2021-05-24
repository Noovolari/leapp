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
import {AwsFederatedAccount} from '../../models/aws-federated-account';
import {AzureAccount} from '../../models/azure-account';
import {BsModalService} from 'ngx-bootstrap/modal';
import {SessionType} from '../../models/session-type';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {AwsTrusterAccount} from '../../models/aws-truster-account';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {LeappNotAwsAccountError} from '../../errors/leapp-not-aws-account-error';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {

  @ViewChild('filterField', { static: false })
  filterField: ElementRef;

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


    // Set regions for ssm
    this.ssmRegions = this.appService.getRegions();

  }


  /**
   * Stop the current session, setting it to false and updating the workspace
   */
  stopSession(session: Session) {
    this.sessionService.stop(session.sessionId);
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
    this.filterInactiveSessions(query);
  }

  filterInactiveSessions(query) {
    if (query !== '') {
      this.notActiveSessions = this.notActiveSessions.filter(s => {
        const idpID = this.workspace.idpUrl.filter(idp => idp && idp.url.toLowerCase().indexOf(query.toLowerCase()) > -1).map(m => m.id);
        return s.account.accountName.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
          ((s.account as AwsFederatedAccount).roleArn && (s.account as AwsFederatedAccount).roleArn.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (this.getProfileName(this.getProfileId(s)).toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (idpID.indexOf((s.account as AwsFederatedAccount).idpUrlId) > -1) ||
          // ((s.account as AwsPlainAccount).user && (s.account as AwsPlainAccount).user.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AzureAccount).tenantId && (s.account as AzureAccount).tenantId.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s.account as AzureAccount).subscriptionId && (s.account as AzureAccount).subscriptionId.toLowerCase().indexOf(query.toLowerCase()) > -1);
      });
    }
  }

  getProfileId(session: Session): string {
    if(session.account.type === SessionType.awsFederated) {
      return (session.account as AwsFederatedAccount).profileId;
    } else if (session.account.type === SessionType.awsPlain) {
      return (session.account as AwsPlainAccount).profileId;
    } else if (session.account.type === SessionType.awsTruster) {
      return (session.account as AwsTrusterAccount).profileId;
    } else if (session.account.type === SessionType.awsSso) {
      return (session.account as AwsSsoAccount).profileId;
    } else {
      throw new LeappNotAwsAccountError(this, 'cannot retrieve profile id of an account that is not an AWS one');
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
