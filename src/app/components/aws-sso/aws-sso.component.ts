import {Component, OnInit} from '@angular/core';
import {AwsSsoSessionProviderService, SsoSession} from '../../services/providers/aws-sso-session-provider.service';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services/app.service';
import {ConfigurationService} from '../../services/configuration.service';
import {WorkspaceService} from '../../services/workspace.service';
import {AwsSsoService} from '../../services/session/aws-sso.service';

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
    private awsSsoProviderService: AwsSsoSessionProviderService,
    private awsSsoService: AwsSsoService,
    private router: Router,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.awsSsoProviderService.awsSsoActive().then(res => {
      console.log(res);
      this.isAwsSsoActive = res;
      this.setValues();
    });
  }

  login() {
    if (this.form.valid) {
      this.awsSsoProviderService.sync(this.selectedRegion, this.form.value.portalUrl).then((ssoSessions: SsoSession[]) => {
        ssoSessions.forEach(ssoSession => {
          this.awsSsoService.create(ssoSession, 'default');
        });
        this.router.navigate(['/sessions', 'session-selected']);
      });
    }
  }

  logout() {
    this.awsSsoProviderService.logout().then(_ => {
      this.isAwsSsoActive = false;
      this.setValues();
    });
  }

  forceSync() {
    const region = this.workspaceService.getAwsSsoConfiguration().region;
    const portalUrl = this.workspaceService.getAwsSsoConfiguration().portalUrl;

    this.awsSsoProviderService.sync(region, portalUrl).then((ssoSessions: SsoSession[]) => {
      ssoSessions.forEach(ssoSession => {
        this.awsSsoService.create(ssoSession, 'default');
      });
      this.router.navigate(['/sessions', 'session-selected']);
    });
  }

  goBack() {
    this.router.navigate(['/', 'integrations']);
  }

  setValues() {
    this.regions = this.appService.getRegions();
    const region = this.workspaceService.getAwsSsoConfiguration().region;
    const portalUrl = this.workspaceService.getAwsSsoConfiguration().portalUrl;

    this.selectedRegion = region || this.regions[0].region;
    this.portalUrl = portalUrl;
    this.form.controls['portalUrl'].setValue(portalUrl);
  }
}
