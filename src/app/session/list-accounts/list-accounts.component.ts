import {Component, OnInit} from '@angular/core';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AwsAccount} from '../../models/aws-account';
import {Router} from '@angular/router';
import {AppService} from '../../services-system/app.service';
import {WorkspaceService} from '../../services/workspace.service';
import {FederatedAccountService} from '../../services/federated-account.service';

@Component({
  selector: 'app-list-accounts',
  templateUrl: './list-accounts.component.html',
  styleUrls: ['./list-accounts.component.scss']
})
export class ListAccountsComponent implements OnInit {

  public accounts;
  public voices = [];

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private workspaceService: WorkspaceService,
    private fedAccountService: FederatedAccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.accounts = this.fedAccountService.listFederatedAccountInWorkSpace();
    this.voices = [{route: ['/sessions', 'create-federated-account'], label: 'Federated Account'}];
  }

  listAccounts(account: AwsAccount) {
    this.router.navigate(['/sessions', 'account'], {queryParams: {accountId: account.accountId}});
  }

  deleteAccount(account: AwsAccount) {
    this.appService.confirmDialog('do you really want to delete this account?', () => {
      this.fedAccountService.deleteFederatedAccount(account.accountNumber);
      this.accounts = this.fedAccountService.listFederatedAccountInWorkSpace();
    });
  }

  editAccount(account: AwsAccount) {
    const editAccount = (account.parent || account.awsRoles[0].parent) ? 'edit-truster-account' : 'edit-federated-account';
    this.router.navigate(['/sessions', editAccount], {queryParams: {accountId: account.accountId}});
  }


}
