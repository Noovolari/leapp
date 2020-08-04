import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AwsAccount} from '../../models/aws-account';
import {AppService} from '../../services-system/app.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {TrusterAccountService} from '../../services/truster-account.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent extends AntiMemLeak implements OnInit {

  public voices = [];
  public account;
  public accounts;
  public fullAccounts;
  public workspace;

  /* Account component si the page where we have the main account chooser */
  constructor(
    private appService: AppService,
    private router: Router,
    private configurationService: ConfigurationService,
    private activatedRoute: ActivatedRoute,
    private trusterAccountService: TrusterAccountService
  ) { super(); }

  ngOnInit() {
    // Get the default workspace
    this.workspace = this.configurationService.getDefaultWorkspaceSync();

    // When you are routed to the current page...
    const sub = this.activatedRoute.queryParams.subscribe(params => {
      // Retrieve the information about account id
      // Get the accounts stored in the current configurations
      // Get the current active account if any
      // Get the truster accounts given the current accounts if any
      const accountId = params['accountId'];
      this.fullAccounts = this.configurationService.getDefaultWorkspaceSync().accountRoleMapping.accounts;
      this.account = this.fullAccounts.filter(el => el.accountId.toString() === accountId.toString())[0];
      this.accounts = this.trusterAccountService.listTrusterAccountInWorkSpace(accountId);

      // Voices for the dropdown menu
      this.voices = [
        {route: ['/sessions', 'create-truster-account'], label: 'Truster Account', queryParams: { accountId: this.account.accountId }},
      ];
    });

    this.subs.add(sub);
  }

  /**
   * Delete the selected account
   * @param account - Aws Account to remove
   */
  deleteAccount(account: AwsAccount) {
    this.appService.confirmDialog('do you really want to delete this account?', () => {
      this.trusterAccountService.deleteTrusterAccount(account.accountNumber);
    });
  }

  /**
   * Go to the Edit Account Page
   * @param account - Aws Account to edit
   */
  editAccount(account: AwsAccount) {
    const editAccount = (account.parent || account.awsRoles[0].parent) ? 'edit-truster-account' : 'edit-federated-account';
    this.router.navigate(['/sessions', editAccount], { queryParams: { accountId: account.accountId }});
  }

  /**
   * Get the number of roles in a specific Accounts
   * @param account - the Aws Account to get the roles count
   */
  getRoleNumber(account: AwsAccount) {
    return account.awsRoles.length;
  }

  /**
   * Show the current object's tray menu
   * @param event - its the click event
   * @param accountNumber - is a string representing the AWS account number
   */
  showTray(event, accountNumber) {

    // Prevent event bubbling on document to avoid the tray keep opening and closing
    if (event) {
      event.stopPropagation();
    }

    // With this we set to visible only on the chosen account
    this.accounts.forEach(s => {
      s.showTray = (s.accountNumber === accountNumber);
    });
  }
}
