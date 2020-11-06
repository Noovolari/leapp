import {Injectable, NgZone} from '@angular/core';
import {AwsSsoService} from './providers/aws-sso.service';
import {switchMap, toArray} from 'rxjs/operators';
import {merge} from 'rxjs';
import {Session} from '../models/session';
import {ConfigurationService} from '../services-system/configuration.service';
import {AccountType} from '../models/AccountType';
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

   this.awsSsoService.loginToAwsSSO('eu-west-1', 'https://d-936704dee0.awsapps.com/start').pipe(
     // API portal Calls
      switchMap((loginToAwsSSOResponse) => this.awsSsoService.listAccounts(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region)),
      // Create an array of observables and then call them in parallel,
      switchMap((response) => {
        const arrayResponse = [];
        response.accountList.forEach( accountInfo => {
          const accountInfoCall = this.awsSsoService.getSessionsFromAccount(accountInfo, response.accessToken, response.region);
          arrayResponse.push(accountInfoCall);
        });
        return merge<Session>(...arrayResponse);
      }),
      // every call will be merged in an Array
      toArray(),

   ).subscribe((AwsSsoSessions) => {
     // Save sessions to workspace
     const workspace = this.configurationService.getDefaultWorkspaceSync();

     // Remove all AWS SSO old session
     workspace.sessions = workspace.sessions.filter(sess => (sess.account.type !== AccountType.AWS_SSO));
     // Add new AWS SSO sessions
     workspace.sessions.push(...AwsSsoSessions);
     this.configurationService.updateWorkspaceSync(workspace);
     this.ngZone.run(() =>  this.router.navigate(['/sessions', 'session-selected']));
   });

  }



}
