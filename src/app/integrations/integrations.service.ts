import {Injectable, NgZone} from '@angular/core';
import {AwsSsoService} from './providers/aws-sso.service';
import {ConfigurationService} from '../services/configuration.service';
import {Router} from '@angular/router';
import {merge, Observable, throwError} from 'rxjs';
import {catchError, switchMap, toArray} from 'rxjs/operators';
import {AppService, LoggerLevel, ToastLevel} from '../services/app.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {environment} from '../../environments/environment';
import {KeychainService} from '../services/keychain.service';
import {Session} from '../models/session';


@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {

  private loginSubscriber: any;

  constructor(private awsSsoService: AwsSsoService,
              private configurationService: ConfigurationService,
              private router: Router,
              private ngZone: NgZone,
              private appService: AppService,
              private keychainService: KeychainService) {}

  login(portalUrl, region) {
    if (this.loginSubscriber) { this.loginSubscriber.unsubscribe(); }
    this.loginSubscriber = this.awsSsoService.generateSessionsFromToken(this.awsSsoService.firstTimeLoginToAwsSSO(region, portalUrl))
      .pipe(
        switchMap((awsSsoSessions: Session[]) => {
          // Save sessions to workspace
          return this.awsSsoService.addSessionsToWorkspace(awsSsoSessions);
        }),
        catchError((err) => {
          this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
          this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');

          return merge(
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
      .subscribe(() => {
        this.ngZone.run(() => {
          this.appService.redrawList.emit(true);
          this.router.navigate(['/sessions', 'session-selected']);
        });
        this.loginSubscriber.unsubscribe();
      });
  }

  logout(): Observable<any> {
    return this.awsSsoService.logOutAwsSso();
  }

  syncAccounts() {
    if (this.loginSubscriber) { this.loginSubscriber.unsubscribe(); }
    console.log('syncing account');
    this.loginSubscriber = this.awsSsoService.generateSessionsFromToken(this.awsSsoService.getAwsSsoPortalCredentials()).pipe(
      switchMap((awsSsoSessions: Session[]) => {
        // Save sessions to workspace
        return this.awsSsoService.addSessionsToWorkspace(awsSsoSessions);
      }),
      catchError( (err) => {
        this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
        this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');
        return throwError(err);
      })
    ).subscribe(() => {
      this.ngZone.run(() => {
        this.appService.redrawList.emit(true);
        this.router.navigate(['/sessions', 'session-selected']);
      });
      this.loginSubscriber.unsubscribe();
    });
  }
}
