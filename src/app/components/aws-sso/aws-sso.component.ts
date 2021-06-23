import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services/app.service';
import {WorkspaceService} from '../../services/workspace.service';
import {AwsSsoRoleService, SsoSession} from '../../services/session/aws/methods/aws-sso-role.service';

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
    private awsSsoService: AwsSsoRoleService,
    private router: Router,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.awsSsoService.awsSsoActive().then(res => {
      this.isAwsSsoActive = res;
      this.setValues();
    });
  }

  login() {
    if (this.form.valid) {
      this.awsSsoService.sync(this.selectedRegion, this.form.value.portalUrl).then((ssoSessions: SsoSession[]) => {
        ssoSessions.forEach(ssoSession => {
          this.awsSsoService.create(ssoSession, this.workspaceService.getDefaultProfileId());
        });
        this.router.navigate(['/sessions', 'session-selected']);
      });
    }
  }

  logout() {
    this.awsSsoService.logout().then(_ => {
      this.isAwsSsoActive = false;
      this.setValues();
    });
  }

  forceSync() {
    const region = this.workspaceService.getAwsSsoConfiguration().region;
    const portalUrl = this.workspaceService.getAwsSsoConfiguration().portalUrl;

    this.awsSsoService.sync(region, portalUrl).then((ssoSessions: SsoSession[]) => {
      ssoSessions.forEach(ssoSession => {
        this.awsSsoService.create(ssoSession, ssoSession.profileId);
      });
      this.router.navigate(['/sessions', 'session-selected']);
    });
  }

  goBack() {
    this.router.navigate(['/sessions', 'session-selected']);
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
