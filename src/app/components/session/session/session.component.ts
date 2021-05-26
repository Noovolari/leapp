import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {WorkspaceService} from '../../../services/workspace.service';
import {ConfigurationService} from '../../../services/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService} from '../../../services/app.service';
import {HttpClient} from '@angular/common/http';
import {Session} from '../../../models/session';
import {SsmService} from '../../../services/ssm.service';
import {FileService} from '../../../services/file.service';
import {SessionService} from '../../../services/session.service';
import {AwsFederatedSession} from '../../../models/aws-federated-session';
import {AzureSession} from '../../../models/azure-session';
import {BsModalService} from 'ngx-bootstrap/modal';
import {SessionType} from '../../../models/session-type';
import {AwsPlainSession} from '../../../models/aws-plain-session';
import {AwsTrusterSession} from '../../../models/aws-truster-session';
import {AwsSsoSession} from '../../../models/aws-sso-session';
import {LeappNotAwsAccountError} from '../../../errors/leapp-not-aws-account-error';
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
        return s.sessionName.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
          ((s as AwsFederatedSession).roleArn && (s as AwsFederatedSession).roleArn.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (this.getProfileName(this.getProfileId(s)).toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (idpID.indexOf((s as AwsFederatedSession).idpUrlId) > -1) ||
          // ((s.account as AwsPlainSession).user && (s.account as AwsPlainSession).user.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s as AzureSession).tenantId && (s as AzureSession).tenantId.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s as AzureSession).subscriptionId && (s as AzureSession).subscriptionId.toLowerCase().indexOf(query.toLowerCase()) > -1);
      });
    }
  }

  getProfileId(session: Session): string {
    if(session.type !== SessionType.azure) {
      return (session as any).profileId;
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
