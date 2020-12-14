import {Injectable, NgZone} from '@angular/core';
import {AwsSsoService} from './providers/aws-sso.service';
import {ConfigurationService} from '../services-system/configuration.service';
import {Router} from '@angular/router';
import {merge, throwError} from 'rxjs';
import {catchError, switchMap, toArray} from 'rxjs/operators';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {environment} from '../../environments/environment';
import {KeychainService} from '../services-system/keychain.service';


@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {

  constructor(private awsSsoService: AwsSsoService,
              private configurationService: ConfigurationService,
              private router: Router,
              private ngZone: NgZone,
              private appService: AppService,
              private keychainService: KeychainService) {}

  login(portalUrl, region) {
    // TODO: togliere observable in input alla funzione e usare lo stream pipe
    this.awsSsoService.generateSessionsFromToken(this.awsSsoService.firstTimeLoginToAwsSSO(region, portalUrl))
      .pipe(
        catchError((err) => {
          this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
          this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');

          return merge(
            fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_PORTAL_URL')),
            fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_REGION')),
            fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_ACCESS_TOKEN')),
            fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_EXPIRATION_TIME'))
          ).pipe(
            toArray(),
            switchMap(() => {
              return throwError(err);
            })
          );
        })
      )
      .subscribe((AwsSsoSessions) => {
        // Save sessions to workspace
        this.awsSsoService.addSessionsToWorkspace(AwsSsoSessions);
        // TODO: refresh forzato della UI tramite motore di Angular.
        this.ngZone.run(() => this.router.navigate(['/sessions', 'session-selected']));
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
