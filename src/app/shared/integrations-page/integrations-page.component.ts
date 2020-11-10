import {Component, OnInit} from '@angular/core';
import {IntegrationsService} from '../../integrations/integrations.service';
import {AwsSsoService} from '../../integrations/providers/aws-sso.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-integrations-page',
  templateUrl: './integrations-page.component.html',
  styleUrls: ['./integrations-page.component.scss']
})
export class IntegrationsPageComponent implements OnInit {

  isAwsSsoActive: boolean;

  constructor(private integrationsService: IntegrationsService,
              private awsSsoService: AwsSsoService,
              private router: Router) {

  }

  ngOnInit() {
    this.awsSsoService.isAwsSsoActive().subscribe(res => this.isAwsSsoActive = res);
  }

  login() {
    this.integrationsService.login();
  }

  logout() {
    this.integrationsService.logout();
    this.awsSsoService.isAwsSsoActive().subscribe(res => this.isAwsSsoActive = res);
  }

  forceSync() {
    this.integrationsService.syncAccounts();
    this.router.navigate(['/sessions', 'session-selected']);
  }
}
