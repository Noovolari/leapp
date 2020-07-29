import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {Router} from '@angular/router';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';
import {FederatedAccountService} from '../../services/federated-account.service';

@Component({
  selector: 'app-setup-first-account',
  templateUrl: './setup-first-account.component.html',
  styleUrls: ['./setup-first-account.component.scss']
})
export class SetupFirstAccountComponent implements OnInit {

  toggleOpen = true;

  regions = [];
  roles: string[] = [];

  checkDisabled = false;

  @Input() selectedRegion;
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    myRegion: new FormControl('', [Validators.required])
  });

  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private credentialsService: CredentialsService,
    private sessionService: SessionService,
    private fedAccountService: FederatedAccountService) {
  }

  ngOnInit() {
    this.regions = this.appService.getRegions();
    this.selectedRegion = this.regions[0].region;
  }

  /**
   * Set the account number when the event is called
   * @param event - the event to call
   */
  setAccountNumber(event) {
    this.form.controls['accountNumber'].setValue(this.appService.extractAccountNumberFromIdpArn(event.target.value));
  }

  /**
   * Save the first account in the workspace
   */
  saveFirstAccount() {
    if (this.form.valid && this.roles.length > 0) {
      try {
        // If the form is valid we save the first account in the configuration
        const workspace = this.configurationService.getDefaultWorkspaceSync();
        const configuration = this.configurationService.getConfigurationFileSync();

        this.fedAccountService.addFederatedAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.generateRolesFromNames(this.form.value.accountNumber),
          this.form.value.idpArn, this.form.value.myRegion);

        this.sessionService.addSession(
          this.form.value.accountNumber,
          this.generateRolesFromNames(this.form.value.accountNumber)[0].name,
          `background-1`,
          true);

        this.credentialsService.refreshCredentialsEmit.emit();

        // Then go to the dashboard
        this.router.navigate(['/sessions', 'session-selected'], {queryParams: {firstAccount: true}});
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  /**
   * Remove a role given a name
   * @param roleName - {string} to check against
   */
  removeRole(roleName: string) {
    const index = this.roles.indexOf(roleName);
    if (index > -1) {
      this.roles.splice(index, 1);
    }
  }

  /**
   * Set a role name when Return is called
   * @param keyEvent - the keyevent which is calle don keyup
   */
  setRoleName(keyEvent) {
    const roleName = this.roleInput.nativeElement.value;
    this.checkDisabled = (roleName !== '');

    if (keyEvent.code === 'Enter' && this.roles.indexOf(roleName) === -1 && roleName !== '') {
      this.roles.push(roleName);
      this.roleInput.nativeElement.value = null;
      this.checkDisabled = false;
    }
  }

  /**
   * By using the names we create the corresponding roles to be pushed inside the account configuration
   * @param accountNumber - the account number we use to construct the role arn
   * @returns - {any[]} - returns a list of aws roles
   */
  generateRolesFromNames(accountNumber: string) {
    const awsRoles = [];
    this.roles.forEach(role => {
      awsRoles.push({
        name: role,
        roleArn: `arn:aws:iam::${accountNumber}:role/${role}`
      });
    });
    return awsRoles;
  }


}
