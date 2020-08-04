import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Workspace} from '../../models/workspace';
import {AwsAccount} from '../../models/aws-account';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {TrusterAccountService} from '../../services/truster-account.service';
import {FederatedAccountService} from '../../services/federated-account.service';

@Component({
  selector: 'app-create-truster-account',
  templateUrl: './create-truster-account.component.html',
  styleUrls: ['./create-truster-account.component.scss']
})
export class CreateTrusterAccountComponent extends AntiMemLeak implements OnInit {

  toggleOpen = true;

  @Input() selectedAccount = '';
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';
  roles: { name: string, roleArn: string }[] = [];

  workspace: Workspace;
  accounts: AwsAccount[];
  accountId;

  regions = [];
  rolesT: string[] = [];
  checkDisabled = false;

  @Input() selectedRegion;
  @ViewChild('roleInput', { static: false }) roleInput: ElementRef;

  public form = new FormGroup({
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    myRegion: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required])
  });

  /* Create a new truster account given the correct form */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private trusterAccountService: TrusterAccountService,
    private federatedAccountService: FederatedAccountService
  ) { super(); }

  ngOnInit() {
    const sub = this.activatedRoute.queryParams.subscribe(params => {
      this.accountId = params['accountId'];

      // Get the workspace and the accounts you need
      this.workspace = this.configurationService.getDefaultWorkspaceSync();
      this.accounts = this.federatedAccountService.listFederatedAccountInWorkSpace();

      // Get the appropriate roles
      const account = this.accounts.filter(acc => (acc.accountId === this.accountId))[0];
      this.roles = account.awsRoles;

      // Set the federated role automatically
      this.selectedAccount = account.accountNumber;
      this.selectedAccountNumber = account.accountNumber;
      this.selectedRole = this.roles[0].name;

      // Get all the regions and set the first one in the UI
      this.regions = this.appService.getRegions();
      this.selectedRegion = this.regions[0].region;
    });

    this.subs.add(sub);
  }

  /**
   * Changes the roles whenever we change the federated account
   * @param event
   */
  changeRoles(event) {
    this.roles = event.awsRoles;
  }

  /**
   * Save the account
   */
  saveAccount() {
    if (this.form.valid && this.rolesT.length > 0) {
      try {
        // Try to create the truster account
        const created = this.trusterAccountService.addTrusterAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.generateRolesFromNames(this.form.value.accountNumber),
          this.form.value.idpArn,
          this.form.value.myRegion);
        if (created) {
          // Then go to next page
          this.router.navigate(['/sessions', 'account'], {queryParams: {accountId: this.accountId}});
        } else {
          this.appService.toast('Account number must be unique', ToastLevel.WARN, 'Add Account');
        }
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  /**
   * Remove the role from the UI
   * @param roleName- the role to remove
   */
  removeRole(roleName: string) {
    const index = this.rolesT.indexOf(roleName);
    if (index > -1) {
      this.rolesT.splice(index, 1);
    }
  }

  /**
   * Set the new role name in the array of roles for the
   * @param keyEvent
   */
  setRoleName(keyEvent) {
    const roleName = this.roleInput.nativeElement.value;
    this.checkDisabled = (roleName !== '');

    if (keyEvent.code === 'Enter' && this.rolesT.indexOf(roleName) === -1 && roleName !== '') {
      this.rolesT.push(roleName);
      this.roleInput.nativeElement.value = null;
      this.checkDisabled = false;
    }
  }

  /**
   * Prepare the array of roles adding the role Arn given the account number
   * @param accountNumber - the account number to use to generate the arn
   */
  generateRolesFromNames(accountNumber) {
    const awsRoles = [];
    this.rolesT.forEach(role => {
      awsRoles.push({
        name: role,
        roleArn: `arn:aws:iam::${accountNumber}:role/${role}`,
        parent: this.selectedAccountNumber,
        parentRole: this.selectedRole,
      });
    });
    return awsRoles;
  }

  /**
   * Return to the account list
   */
  goToList() {
    // Return to list
    this.router.navigate(['/sessions', 'account'], { queryParams: { accountId: this.accountId }});
  }

}
