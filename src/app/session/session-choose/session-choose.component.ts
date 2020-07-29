import {Component, Input, OnInit} from '@angular/core';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Router} from '@angular/router';
import {AccountData, RoleData} from '../../models/sessionData';
import {Workspace} from '../../models/workspace';
import {AppService, ToastLevel} from '../../services-system/app.service';

@Component({
  selector: 'app-session-choose',
  templateUrl: './session-choose.component.html',
  styleUrls: ['./session-choose.component.scss']
})
export class SessionChooseComponent implements OnInit {

  @Input() selectedAccount;
  @Input() selectedAccountNumber;
  @Input() selectedRole;

  accounts = [];
  roles = [];

  private workspace: Workspace;

  constructor(
    private configurationService: ConfigurationService,
    private router: Router,
    private appService: AppService
  ) {
    // Get workspace
    this.workspace = this.configurationService.getDefaultWorkspaceSync();

    // Remove Refresh Credentials from Local Storage
    localStorage.removeItem('RefreshStarted');

    // Remove Timer
    localStorage.removeItem('CurrentTime');
    localStorage.removeItem('CurrentTimer');
    localStorage.removeItem('CurrentSeconds');
  }

  ngOnInit() {
    if (this.workspace) {

      // Prepare the array to pass the selection to the selewct objects and
      // then go to the session page when the start button is clicked
      this.refreshRoleMapping();
    } else {

      // No workspace found return an error
      this.appService.toast('No workspace found for this identifier', ToastLevel.WARN);
    }
  }

  /**
   * Prepare the data for selection
   */
  refreshRoleMapping() {

    const roleMappings = this.workspace.accountRoleMapping;
    if (roleMappings.accounts.length > 0) {
      this.accounts = roleMappings.accounts.map(el => { el['accountNameMod'] = el.accountName + (el.parent ? ' - T' : ' - F'); return el; });

      this.roles = roleMappings.accounts[0].awsRoles;

      this.selectedAccount = this.accounts[0];
      this.selectedAccountNumber = this.accounts[0].accountNumber;
    }
  }

  /**
   * Set the roles to select
   * @param event - the change event, not used
   */
  changeRoles(event) {
    // console.log(this.accounts);

    const roleMappings = this.workspace.accountRoleMapping;
    const account = roleMappings.accounts.filter(el => el.accountNumber === this.selectedAccountNumber)[0];
    this.roles = account ? account.awsRoles : [];
    if (this.roles && this.roles.length > 0) {
      this.selectedRole = this.roles[0].name;
    } else  {
      this.selectedRole = null;
      this.appService.toast('Please create a role for this account.', ToastLevel.WARN, 'No roles for this account');
    }
  }

  /**
   * Go to account list
   */
  goToListAccount() {
    this.router.navigate(['/sessions', 'list-accounts']);
  }

  /**
   * Go to session select screen aka the home screen for lookauth client
   */
  goToSession() {

    // Configure the account and role for next page
    this.workspace.principalAccountNumber = this.selectedAccountNumber;
    this.workspace.principalRoleName = this.selectedRole;
    this.configurationService.updateWorkspaceSync(this.workspace);

    // Go!
    this.router.navigate(['/sessions', 'session-selected']);
  }
}
