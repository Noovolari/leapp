import {Injectable, NgZone} from '@angular/core';
import {IdpResponseType, WorkspaceService} from './workspace.service';
import {ConfigurationService} from '../services-system/configuration.service';
import {AccountType} from '../models/AccountType';
import {AppService, ToastLevel} from '../services-system/app.service';
import {SessionService} from './session.service';
import {FederatedAccountService} from './federated-account.service';
import {TrusterAccountService} from './truster-account.service';
import {AzureAccountService} from './azure-account.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProviderManagerService {
  form;
  accountType;
  accountId;
  selectedType;
  selectedAccount;
  selectedRole;

  /**
   * Used to manage all the choices done in the app regarding the correct provider to use:
   * this way we have a first step encapsulating logic and working on modularity
   */
  constructor(
    private router: Router,
    private ngZone: NgZone,
    private appService: AppService,
    private configurationService: ConfigurationService,
    private workspaceService: WorkspaceService,
    private sessionService: SessionService,
    private federatedAccountService: FederatedAccountService,
    private trusterAccountService: TrusterAccountService,
    private azureAccountService: AzureAccountService
  ) {

  }

  /**
   * Get all the federated roles of an acocunt
   * @param accounts - the accounts from a listFederatedAccountInWorkSpace() call
   * @param selectedAccount - the one selected to get the roles
   */
  getFederatedRoles(accounts, selectedAccount) {
    // Get the appropriate roles
    const account = accounts.filter(acc => (acc.accountId === selectedAccount))[0];

    if (account !== undefined && account !== null) {

      // The federated roles we have obtained from the filter
      const federatedRoles = account.awsRoles;
      // Set the federated role automatically
      return { federatedRoles, selectedAccountNumber: account.accountNumber, selectedrole: federatedRoles[0].name };
    }
    return { federatedRoles: [], selectedAccountNumber: null, selectedrole: null };
  }

  /**
   * Save the first account of the Application
   * @param accountId - the account Id that we are creating
   * @param accountType - the account Type you have chosen
   * @param selectedAccount - the selected account as a parent for
   * @param selectedRole - the selected role of the parent
   * @param selectedType - the type of AWS account, if any, that you have selected
   * @param form - the form to use
   */
  saveFirstAccount(accountId, accountType, selectedAccount, selectedRole, selectedType, form) {
    // Set our variable to avoid sending them to all methods;
    // besides the scope of this service is to manage saving and editing
    // of multi providers so having some helper class variables is ok
    this.accountId = accountId;
    this.accountType = accountType;
    this.selectedType = selectedType;
    this.selectedAccount = selectedAccount;
    this.selectedRole = selectedRole;
    this.form = form;

    // Before we need to save the first workspace and call google: this is done only the first ime so it is not used in other classes
    // Now we get the default configuration to obtain the previously saved idp url
    const configuration = this.configurationService.getConfigurationFileSync();

    // Update Configuration
    if (accountType === AccountType.AWS) {
      configuration.federationUrl = form.value.federationUrl;
      this.configurationService.updateConfigurationFileSync(configuration);

      // Set our response type
      const responseType = IdpResponseType.SAML;

      // When the token is received save it and go to the setup page for the first account
      const sub = this.workspaceService.googleEmit.subscribe((googleToken) => this.ngZone.run(() => this.createNewWorkspace(googleToken, configuration.federationUrl, responseType)));

      // Call the service for working on the first login event to the user idp
      // We add the helper for account choosing just to be sure to give the possibility to call the correct user
      this.workspaceService.getIdpTokenInSetup(form.value.federationUrl, responseType);
    } else {
      this.decideSavingMethodAndSave();
    }
  }

  /**
   * Save the first account of the Application
   * @param accountId - the account Id that we are creating
   * @param accountType - the account Type you have chosen
   * @param selectedAccount - the selected account as a parent for
   * @param selectedRole - the selected role of the parent
   * @param selectedType - the type of AWS account, if any, that you have selected
   * @param form - the form to use
   */
  saveAccount(accountId, accountType, selectedAccount, selectedRole, selectedType, form) {
    // Set our variable to avoid sending them to all methods;
    // besides the scope of this service is to manage saving and editing
    // of multi providers so having some helper class variables is ok
    this.accountId = accountId;
    this.accountType = accountType;
    this.selectedType = selectedType;
    this.selectedAccount = selectedAccount;
    this.selectedRole = selectedRole;
    this.form = form;
    this.decideSavingMethodAndSave();
  }

  /**
   * When the data from Google is received, generate a new workspace or check errors, etc.
   */
  createNewWorkspace(googleToken, federationUrl, responseType) {

    const name = 'default';
    const result = this.workspaceService.createNewWorkspace(googleToken, federationUrl, name, responseType);
    if (result) {
      this.decideSavingMethodAndSave();
    } else {
      // Error: return to dependencies page
      this.appService.toast('Can\'t create a new workspace for first account', ToastLevel.ERROR, 'Creation error');
    }
  }

  decideSavingMethodAndSave() {
    let result = true;
    if (this.accountType === AccountType.AWS) {
      if (this.selectedType === 'federated') {
        result = this.saveAwsFederatedAccount();
      } else {
        result = this.saveAwsTrusterAccount();
      }
    } else {
      result = this.saveAzureAccount();
    }

    if (result) {
      // Then go to next page
      this.router.navigate(['/sessions', 'session-selected'], {queryParams: {accountId: this.accountId}});
    } else {
      this.appService.toast('Subscription Id must be unique', ToastLevel.WARN, 'Add Account');
    }
  }

  /**
   * Save azure account
   */
  saveAzureAccount() {
    if (this.formValid(this.form, this.accountType, this.selectedType)) {
      try {
        // Try to create the truster account
        const created = this.azureAccountService.addAzureAccountToWorkSpace(
          this.form.value.subscriptionId,
          this.form.value.name);

        return created;
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
        return false;
      }
    } else {
      this.appService.toast('Missing required parameters for account', ToastLevel.WARN, 'Add required elements to Account');
      return false;
    }
  }

  /**
   * This will be removed after created the correct file also in normal mode
   */
  saveAwsTrusterAccount() {
    if (this.formValid(this.form, this.accountType, this.selectedType)) {
      try {
        // Try to create the truster account
        const created = this.trusterAccountService.addTrusterAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.selectedAccount,
          this.selectedRole,
          this.generateRolesFromNames(this.form),
          this.form.value.idpArn,
          this.form.value.myRegion);

        return created;
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
        return false;
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
      return false;
    }
  }

  saveAwsFederatedAccount() {
    if (this.formValid(this.form, this.accountType, this.selectedType)) {
      try {
        // Add a federation Account to the workspace
        const created = this.federatedAccountService.addFederatedAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.generateRolesFromNames(this.form),
          this.form.value.idpArn);

        return created;
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
        return false;
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
      return false;
    }
  }

  /**
   * Because the form is complex we need a custom form validation
   * In the future we will put this in a service to create validation factory:
   * this way depending on new accounts we jkust need to pass the form object to the validator
   */
  formValid(form, accountType, selectedType) {

    // First check the type of account we are creating
    if (accountType === AccountType.AWS) {

      // We are in AWS check if we are saving a Federated or a Truster
      if (selectedType === 'federated') {
        // Check Federated fields
        const checkFields = form.controls['name'].valid &&
          form.controls['federationUrl'].valid &&
          form.controls['accountNumber'].valid &&
          form.controls['role'].valid &&
          form.controls['idpArn'].valid;

        return checkFields;
      } else {
        // Check Truster fields
        const checkFields = form.controls['name'].valid &&
          form.controls['federationUrl'].valid &&
          form.controls['accountNumber'].valid &&
          form.controls['role'].valid &&
          form.controls['federatedAccount'].valid &&
          form.controls['federatedRole'].valid;

        return checkFields;
      }
    } else {
      // Check Azure fields
      return form.controls['name'].valid &&
             form.controls['subscriptionId'].valid;
    }
    return false;
  }

  /**
   * By using the names we create the corresponding roles to be pushed inside the account configuration
   * @param form - the form to access the role from
   * @returns - {any[]} - returns a list of aws roles
   */
  generateRolesFromNames(form) {
    const awsRoles = [];
    const role = form.controls['role'].value;
    const accountNumber = form.controls['accountNumber'].value;
    awsRoles.push({ name: role, roleArn: `arn:aws:iam::${accountNumber}:role/${role}` });
    return awsRoles;
  }

  getFederatedAccounts() {
    return this.federatedAccountService.listFederatedAccountInWorkSpace();
  }
}

