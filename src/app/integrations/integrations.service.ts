import {Injectable, NgZone} from '@angular/core';
import {AwsSsoService} from './providers/aws-sso.service';
import {ConfigurationService} from '../services-system/configuration.service';
import {Router} from '@angular/router';
import {from, Observable} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {

  constructor(private awsSsoService: AwsSsoService,
              private configurationService: ConfigurationService,
              private router: Router,
              private ngZone: NgZone) {}

  login(portalUrl, region) {
   this.awsSsoService.generateSessionsFromToken(this.awsSsoService.firstTimeLoginToAwsSSO(region, portalUrl))
     .subscribe((AwsSsoSessions) => {
     // Save sessions to workspace
     this.awsSsoService.addSessionsToWorkspace(AwsSsoSessions);
     this.ngZone.run(() =>  this.router.navigate(['/sessions', 'session-selected']));
   });
  }


  logout() {
    this.awsSsoService.logOutAwsSso();
  }

  syncAccounts() {
    this.awsSsoService.generateSessionsFromToken(this.awsSsoService.getAwsSsoPortalCredentials()).subscribe((AwsSsoSessions) => {
      this.awsSsoService.addSessionsToWorkspace(AwsSsoSessions);
      this.ngZone.run(() =>  this.router.navigate(['/sessions', 'session-selected']));
    });
  }
}
