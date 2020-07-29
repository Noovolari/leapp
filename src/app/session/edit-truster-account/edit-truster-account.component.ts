import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {AwsAccount} from '../../models/aws-account';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {TrusterAccountService} from '../../services/truster-account.service';
import {FederatedAccountService} from '../../services/federated-account.service';

@Component({
  selector: 'app-edit-truster-account',
  templateUrl: './edit-truster-account.component.html',
  styleUrls: ['./edit-truster-account.component.scss']
})
export class EditTrusterAccountComponent extends AntiMemLeak implements OnInit {

  toggleOpen = true;

  @Input() selectedAccount = '';
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';

  accounts: AwsAccount[] = [];
  roles: { name: string, roleArn: string }[] = [];

  account;
  parentAccountId;

  checkDisabled = false;

  regions = [];
  @Input() selectedRegion;
  rolesT: string[] = [];

  @ViewChild('roleInput', { static: false }) roleInput: ElementRef;

  public form = new FormGroup({
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    myRegion: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
  });

  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private trusterAccountService: TrusterAccountService,
    private federatedAccountService: FederatedAccountService
  ) {
    super();

    this.accounts = this.federatedAccountService.listFederatedAccountInWorkSpace();

    const sub = this.activatedRoute.queryParams.subscribe(params => {
      this.account = this.trusterAccountService.getTrusterAccountInWorkSpace(params['accountId']);

      this.selectedAccount = this.account;
      this.selectedAccountNumber = (this.account.parent || this.account.awsRoles[0].parent);
      this.selectedRole = (this.account.parentRole || this.account.awsRoles[0].parentRole);

      const parentAccount = this.federatedAccountService.getFederatedAccountInWorkSpace(this.account.awsRoles[0].parent);
      this.parentAccountId = parentAccount.accountId;

      this.roles = parentAccount.awsRoles;
      this.rolesT = this.account.awsRoles.map(r => r.name);

      this.appService.validateAllFormFields(this.form);
    });

    this.subs.add(sub);
  }

  ngOnInit() {
    this.regions = this.appService.getRegions();
    this.selectedRegion = this.account.region ? this.account.region : this.regions[0].region;
  }

  changeRoles(event) {
    this.roles = event.awsRoles;
  }

  saveAccount() {
    if (this.form.valid && this.rolesT.length > 0) {

        // edit account
      const tacc = {
        accountId: this.form.value.accountNumber,
        accountName: this.form.value.name,
        accountNumber: this.form.value.accountNumber,
        awsRoles: this.generateRolesFromNames(this.form.value.accountNumber),
        idpArn: this.form.value.idpArn,
        type: 'AWS',
        region: this.form.value.myRegion,
      };

      const updated = this.trusterAccountService.updateTrusterAccount(tacc);
      if (updated) {
        this.router.navigate(['/sessions', 'account'], {queryParams: {accountId: this.parentAccountId}});
      } else {
        this.appService.toast('Cannot update account, account does not exist', ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  removeRole(roleName: string) {
    const index = this.rolesT.indexOf(roleName);
    if (index > -1) {
      this.rolesT.splice(index, 1);
    }
  }

  setRoleName(keyEvent) {
    const roleName = this.roleInput.nativeElement.value;
    this.checkDisabled = (roleName !== '');

    if (keyEvent.code === 'Enter' && this.rolesT.indexOf(roleName) === -1 && roleName !== '') {
      this.rolesT.push(roleName);
      this.roleInput.nativeElement.value = null;
      this.checkDisabled = false;
    }
  }

  generateRolesFromNames(accountNumber) {
    const awsRoles = [];
    this.rolesT.forEach(role => {
      awsRoles.push({
        name: role,
        roleArn: `arn:aws:iam::${accountNumber}:role/${role}`,
        parent: this.selectedAccountNumber,
        parentRole: this.selectedRole
      });
    });
    console.log();
    return awsRoles;
  }

  goToList() {
    // Return to list
    this.router.navigate(['/sessions', 'account'], { queryParams: { accountId: this.parentAccountId }});
  }
}
