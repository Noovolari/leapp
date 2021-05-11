import {Component, OnInit} from '@angular/core';
import {IntegrationsService} from '../../integrations.service';
import {AwsSsoService} from '../../providers/aws-sso.service';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../../services/app.service';
import {ConfigurationService} from '../../../services/configuration.service';
import {merge} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {environment} from '../../../../environments/environment';
import {tap} from 'rxjs/operators';
import {KeychainService} from '../../../services/keychain.service';

@Component({
  selector: 'app-aws-sso',
  templateUrl: './aws-sso.component.html',
  styleUrls: ['./aws-sso.component.scss']
})
export class AwsSsoComponent implements OnInit {

  isAwsSsoActive: boolean;
  regions = [];
  selectedRegion;
  portalUrl;
  loading = false;

  public form = new FormGroup({
    portalUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    awsRegion: new FormControl('', [Validators.required])
  });

  constructor(
    private appService: AppService,
    private configurationservice: ConfigurationService,
    private integrationsService: IntegrationsService,
    private awsSsoService: AwsSsoService,
    private router: Router,
    private keychainService: KeychainService
  ) {}

  ngOnInit() {
    this.awsSsoService.isAwsSsoActive().subscribe(res => {
      this.isAwsSsoActive = res;
      this.setValues();
    });
  }

  login() {
    if (this.form.valid) {
      this.integrationsService.login(this.form.value.portalUrl, this.selectedRegion);
    }
  }

  logout() {
    this.integrationsService.logout().subscribe(() => {
      this.isAwsSsoActive = false;
      this.setValues();
    }, (err) => {
      this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
      this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');
    });
  }

  forceSync() {
    this.integrationsService.syncAccounts();
  }

  goBack() {
    this.router.navigate(['/', 'integrations', 'list']);
  }

  setValues() {
    this.regions = this.appService.getRegions();
    this.selectedRegion = this.regions[0].region;

    merge(
      fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_REGION')).pipe(tap(res => {
        this.selectedRegion = res;
      })),
      fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_PORTAL_URL')).pipe(tap(res => {
        this.portalUrl = res;
        this.form.controls['portalUrl'].setValue(res);
      }))
    ).subscribe();
  }
}
