import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {FederatedAccountService} from '../../services/federated-account.service';

@Component({
  selector: 'app-edit-federated-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss']
})
export class EditAccountComponent extends AntiMemLeak implements OnInit {

  toggleOpen = true;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    myRegion: new FormControl('', [Validators.required])
  });

  public account;

  regions = [];
  roles: string[] = [];

  checkDisabled = false;

  @Input() selectedRegion;
  @ViewChild('roleInput', { static: false }) roleInput: ElementRef;

  /**
   * Edit a federated account changing  its parameters
   */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fedAccountService: FederatedAccountService
  ) {
    super();
  }

  ngOnInit() {
    const sub = this.activatedRoute.queryParams.subscribe(params => {
      const accountId = params['accountId'];
      const accounts = this.configurationService.getDefaultWorkspaceSync().accountRoleMapping.accounts;
      this.account = accounts.filter(el => el.accountId.toString() === accountId.toString())[0];
      this.roles = this.account.awsRoles.map(role => role.name);
      this.appService.validateAllFormFields(this.form);
    });

    this.subs.add(sub);

    this.regions = this.appService.getRegions();
    this.selectedRegion = this.account.region ? this.account.region : this.regions[0].region;
  }

  /**
   * Set the new account number directly from the Idp Arn
   * @param event - the change event
   */
  setAccountNumber(event) {
    this.form.controls['accountNumber'].setValue(this.appService.extractAccountNumberFromIdpArn(event.target.value));
  }

  /**
   * Save the edited federated account
   */
  saveAccount() {
    if (this.form.valid && this.roles.length > 0) {
      try {
        const configuration = this.configurationService.getConfigurationFileSync();

        // edit account
        const acc = {
          accountId: this.form.value.accountNumber,
          accountName: this.form.value.name,
          accountNumber: this.form.value.accountNumber,
          awsRoles: this.generateRolesFromNames(this.form.value.accountNumber),
          idpArn: this.form.value.idpArn,
          idpUrl: configuration.federationUrl,
          region: this.form.value.myRegion,
          type: 'AWS'
        };

        this.fedAccountService.updateFederatedAccount(acc);


        // Then go to next page
        this.router.navigate(['/sessions', 'list-accounts']);

      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  /**
   * Remove the role from the UI
   * @param roleName - the role name to remove
   */
  removeRole(roleName: string) {
    const index = this.roles.indexOf(roleName);
    if (index > -1) {
      this.roles.splice(index, 1);
    }
  }

  /**
   * Set the new role name in the array of roles for saving
   * @param keyEvent - the key event that we listen to
   */
  setRoleName(keyEvent) {
    const roleName = this.roleInput.nativeElement.value;
    this.checkDisabled = (roleName !== '');
    // Set the role if we press enter
    if (keyEvent.code === 'Enter' && this.roles.indexOf(roleName) === -1 && roleName !== '') {
      this.roles.push(roleName);
      this.roleInput.nativeElement.value = null;
      this.checkDisabled = false;
    }
  }

  // Decorate the roles with the arn
  generateRolesFromNames(accountNumber) {
    const awsRoles = [];
    this.roles.forEach(role => {
      awsRoles.push({
        name: role,
        roleArn: `arn:aws:iam::${accountNumber}:role/${role}`
      });
    });
    return awsRoles;
  }

  // Return to the list of accounts
  goToList() {
    // Return to list
    this.router.navigate(['/sessions', 'list-accounts']);
  }
}
