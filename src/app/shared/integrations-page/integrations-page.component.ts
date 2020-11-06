import {Component, OnInit} from '@angular/core';
import {IntegrationsService} from '../../integrations/integrations.service';

@Component({
  selector: 'app-integrations-page',
  templateUrl: './integrations-page.component.html',
  styleUrls: ['./integrations-page.component.scss']
})
export class IntegrationsPageComponent implements OnInit {

  constructor(private integrationsService: IntegrationsService) { }

  ngOnInit() {
  }

  login() {
    this.integrationsService.login();
  }
}
