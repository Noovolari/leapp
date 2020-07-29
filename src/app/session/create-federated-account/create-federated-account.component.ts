import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {WorkspaceService} from '../../services/workspace.service';
import {FederatedAccountService} from '../../services/federated-account.service';

@Component({
  selector: 'app-create-federated-account',
  templateUrl: './create-federated-account.component.html',
  styleUrls: ['./create-federated-account.component.scss']
})
export class CreateFederatedAccountComponent implements OnInit {

  toggleOpen = true;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    myRegion: new FormControl('', [Validators.required])
  });

  checkDisabled = false;

  regions = [];
  roles: string[] = [];
  @Input() selectedRegion;
  @ViewChild('roleInput', { static: false }) roleInput: ElementRef;

  constructor(
    private configurationService: ConfigurationService,
    private workspaceService: WorkspaceService,
    private appService: AppService,
    private fedAccountService: FederatedAccountService,
    private router: Router
  ) { }

  ngOnInit() {
    this.regions = this.appService.getRegions();
    this.selectedRegion = this.regions[0].region;
  }

  setAccountNumber(event) {
    this.form.controls['accountNumber'].setValue(this.appService.extractAccountNumberFromIdpArn(event.target.value));
  }

  saveAccount() {
    if (this.form.valid && this.roles.length > 0) {
      try {
        const accountCreated = this.fedAccountService.addFederatedAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.generateRolesFromNames(this.form.value.accountNumber),
          this.form.value.idpArn, this.form.value.myRegion);
        if (!accountCreated) {
          this.appService.toast('Account number must be unique', ToastLevel.WARN, 'Add Account');
        } else {
          this.router.navigate(['/sessions', 'list-accounts']);
        }
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  removeRole(roleName: string) {
    const index = this.roles.indexOf(roleName);
    if (index > -1) {
      this.roles.splice(index, 1);
    }
  }

  setRoleName(keyEvent) {
    const roleName = this.roleInput.nativeElement.value;
    this.checkDisabled = (roleName !== '');

    if (keyEvent.code === 'Enter' && this.roles.indexOf(roleName) === -1 && roleName !== '') {
      this.roles.push(roleName);
      this.roleInput.nativeElement.value = null;
      this.checkDisabled = false;
    }
  }

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

  goToList() {
    // Return to list
    this.router.navigate(['/sessions', 'list-accounts']);
  }
}
