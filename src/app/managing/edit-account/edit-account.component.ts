import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Workspace} from '../../models/workspace';
import {ProviderManagerService} from '../../services/provider-manager.service';
import {AccountType} from '../../models/AccountType';
import {Session} from '../../models/session';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {KeychainService} from '../../services-system/keychain.service';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss']
})
export class EditAccountComponent implements OnInit {
  accountType = AccountType.AWS_PLAIN_USER;
  provider = AccountType.AWS;
  selectedSession: Session;

  selectedAccountNumber = '';
  selectedRole = '';
  selectedRegion;
  regions = [];

  workspace: Workspace;

  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    plainUser: new FormControl('', [Validators.required]),
    mfaDevice: new FormControl('')
  });

  /* Setup the first account for the application */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private providerManagerService: ProviderManagerService,
    private keychainService: KeychainService
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // Get the workspace and the account you need
      this.workspace = this.configurationService.getDefaultWorkspaceSync();
      this.selectedSession = this.workspace.sessions.filter(session => session.id === params.sessionId)[0];
      const selectedAccount = (this.selectedSession.account as AwsPlainAccount);

      // Get the region
      this.regions = this.appService.getRegions();
      this.selectedRegion = this.regions.filter(r => r.region === selectedAccount.region)[0].region;
      this.form.controls['awsRegion'].setValue(this.selectedRegion);

      // Get other readonly properties
      this.form.controls['name'].setValue(selectedAccount.accountName);
      this.form.controls['accountNumber'].setValue(selectedAccount.accountNumber);
      this.form.controls['plainUser'].setValue(selectedAccount.user);
      this.form.controls['mfaDevice'].setValue(selectedAccount.mfaDevice);

      this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateAccessString(selectedAccount.accountName, (selectedAccount as AwsPlainAccount).user)).subscribe((accessKey) => this.form.controls['accessKey'].setValue(accessKey));
      this.keychainService.getSecret(environment.appName, this.appService.keychainGenerateSecretString(selectedAccount.accountName, (selectedAccount as AwsPlainAccount).user)).subscribe((secretKey) => this.form.controls['secretKey'].setValue(secretKey));
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
    this.providerManagerService.editAccount(this.selectedSession, this.selectedRegion, this.form);
  }

  formValid() {
    return this.providerManagerService.formValid(this.form, this.accountType);
  }

  goBack() {
    this.workspace = this.configurationService.getDefaultWorkspaceSync();
    this.router.navigate(['/sessions', 'session-selected']);
  }

  openAccessStrategyDocumentation() {
    this.appService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }
}
