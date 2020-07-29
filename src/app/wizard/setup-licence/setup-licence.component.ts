import {Component, OnInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {WorkspaceService} from '../../services/workspace.service';
import {LicenceService} from '../../services/licence.service';

@Component({
  selector: 'app-setup-licence',
  templateUrl: './setup-licence.component.html',
  styleUrls: ['./setup-licence.component.scss']
})
export class SetupLicenceComponent implements OnInit {

  loading = false;

  // tell us if we are in lite client mode or not
  liteClient = environment.liteClient;

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    licence: new FormControl('', [Validators.required])
  });

  constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private appService: AppService,
    private licenceService: LicenceService
  ) { }

  ngOnInit() {}

  /**
   * Submit from form...
   */
  submit() {
    if (this.liteClient) {
      this.form.controls['name'].setValue('default');
      this.form.controls['name'].markAsTouched();
    }

    console.log();
    console.log();

    this.licenceService.checkOnlineLicence(
      this.form.controls['licence'].value,
      this.licenceService.retrieveUID(),
      this.form.controls['name'].value).subscribe(res => {

      const configuration = this.configurationService.getConfigurationFileSync();
      configuration.uid = this.licenceService.retrieveUID();
      configuration.licence = this.form.controls['licence'].value;
      this.configurationService.updateConfigurationFileSync(configuration);

        const workspace = this.configurationService.getDefaultWorkspaceSync();
        if (workspace.accountRoleMapping &&
          workspace.accountRoleMapping.accounts &&
          workspace.accountRoleMapping.accounts.length > 0) {
          // Stop the loader
          this.loading = false;
          // We already have at least one default account to start, let's go to session page
          this.router.navigate(['/sessions', 'session-selected']);
        } else {
          // We need to setup at least on e Principal Account and Role (aka Federated one)
          // But we also check for the new liteClient variable: if true we go to the setup,
          // otherwise we go directly to the session download as we need the list
          if (this.liteClient) {
            // Stop the loader
            this.loading = false;
            this.router.navigate(['/wizard', 'setup-welcome']);
          } else {
            // Stop the loader
            this.loading = false;
            this.router.navigate(['/wizard', 'setup-workspace']);
          }
        }
    }, err => {
      this.loading = false;
      this.appService.toast(err, ToastLevel.WARN, 'Licence error');
    });
  }

  checkValid() {
    let check = false;
    check = this.form.controls['licence'].value === '';
    if (!this.liteClient) {
      check = check || this.form.controls['name'].value === '';
    }
    return check;
  }

  /**
   * Clear workspace form
   */
  clearForm() {
    this.form.reset();
  }

}
