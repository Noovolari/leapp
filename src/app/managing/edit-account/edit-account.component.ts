import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Workspace} from '../../models/workspace';
import {AwsAccount} from '../../models/aws-account';
import {ProviderManagerService} from '../../services/provider-manager.service';
import {AccountType} from '../../models/AccountType';
import {Session} from '../../models/session';

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss']
})
export class EditAccountComponent implements OnInit {
  accountType = AccountType.AWS_PLAIN_USER;
  provider = AccountType.AWS;
  selectedSession: Session

  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';

  workspace: Workspace;

  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
  });

  /* Setup the first account for the application */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private providerManagerService: ProviderManagerService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // Get the workspace and the accounts you need
      this.workspace = this.configurationService.getDefaultWorkspaceSync();
      this.selectedSession = this.workspace.sessions.filter(
        session => session.id === params.sessionId
      )[0]
    });
  }

  /**
   * Set the account number when the event is called
   * @param event - the event to call
   */
  setAccountNumber(event) {
    this.form.controls['accountNumber'].setValue(this.appService.extractAccountNumberFromIdpArn(event.target.value));
  }

  /**
   * Save the edited account in the workspace
   */
  saveAccount() {
    this.providerManagerService.editAccount(this.selectedSession, this.form)
  }

  formValid() {
    return this.providerManagerService.formValid(this.form, this.accountType, 'EDIT');
  }

  goBack() {
    this.workspace = this.configurationService.getDefaultWorkspaceSync();
    this.router.navigate(['/sessions', 'session-selected']);
  }
}
