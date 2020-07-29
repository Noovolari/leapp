import {Component, OnInit} from '@angular/core';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {ConfigurationService} from '../../services-system/configuration.service';

@Component({
  selector: 'app-set-federation-url',
  templateUrl: './set-federation-url.component.html',
  styleUrls: ['./set-federation-url.component.scss']
})
export class SetFederationUrlComponent implements OnInit {

  public form = new FormGroup({
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
  });

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private router: Router) {

  }

  ngOnInit() {}

  /**
   * Save the federation url in the configuration to later be used with workspaces and accounts
   */
  saveFederationUrl() {
    if (this.form.valid) {
      try {
        // First operation we need to be sure that google cache for electorn is clean
        this.configurationService.cleanData();
        // Obtain the configuration file
        // Save the new federation url
        // Update Configuration
        const config = this.configurationService.getConfigurationFileSync();
        config.federationUrl = this.form.value.federationUrl;
        this.configurationService.updateConfigurationFileSync(config);

        // Then go to next page
        this.router.navigate(['/wizard', 'setup-spinner-for-login']);
      } catch (err) {

        // Catch the error and show the message
        this.appService.toast(err, ToastLevel.ERROR);
      }
    }
  }

}
