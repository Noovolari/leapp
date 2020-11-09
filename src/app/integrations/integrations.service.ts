import {Injectable, NgZone} from '@angular/core';
import {AwsSsoService} from './providers/aws-sso.service';
import {ConfigurationService} from '../services-system/configuration.service';
import {Router} from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {


  constructor(private awsSsoService: AwsSsoService,
              private configurationService: ConfigurationService,
              private router: Router,
              private ngZone: NgZone) {}

  login() {

   this.awsSsoService.generateSessionsFromToken(this.awsSsoService.firstTimeLoginToAwsSSO('eu-west-1', 'https://d-936704dee0.awsapps.com/start'))
     .subscribe((AwsSsoSessions) => {
     // Save sessions to workspace
     this.awsSsoService.addSessionsToWorkspace(AwsSsoSessions);
     this.ngZone.run(() =>  this.router.navigate(['/sessions', 'session-selected']));
   });

  }



}
