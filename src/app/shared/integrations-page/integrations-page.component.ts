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

  showProviderList = false;

  constructor(private integrationsService: IntegrationsService,
              private awsSsoService: AwsSsoService,
              private router: Router) {

  }

  ngOnInit(): void {
    this.showProviderList = false;
  }

  goBack() {
    if (this.showProviderList) {
      this.showProviderList = false;
    } else {
      this.router.navigate(['/', 'sessions', 'session-selected']);
    }
  }

  showProviders() {
    this.showProviderList = true;
  }

  goToAwsSSO() {
    this.router.navigate(['/', 'integrations', 'aws-sso']);
  }

}
