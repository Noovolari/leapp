import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {Observable} from 'rxjs';
import {CognitoAuth} from '../models/cognito-auth';
import {switchMap} from 'rxjs/operators';
import {finalize} from 'rxjs/internal/operators';

@Injectable({
  providedIn: 'root'
})
export class CognitoService {
  constructor(
    private appService: AppService,
    private httpService: HttpClient
  ) {}
  /**
   * Returns an observable to subscribe to: this one returns a
   * token for authentication with our backend calls
   * @returns an observable with type of {Observable<CognitoAuth>}
   */
  // TODO: getCognitoToken contain Eddie manager api. It should not. It's needed?
  getCognitoAuthorizationToken(window: any): Observable<CognitoAuth> {
    return this.getAuthorizeCode()
      .pipe(
        switchMap(authData => {
          // Retrieve the authorization token
          this.appService.logger(authData.message, LoggerLevel.INFO);
          try {
            const authMessage = JSON.parse(authData).message;
            return this.getCognitoToken(JSON.parse(authMessage).code);
          } catch (err) {
            // Try to call a new user if never inside cognito auth loop and show consent, etc., etc.
            const getAuthorizeUrl = this.constructAuthUrl();
            window.loadURL(getAuthorizeUrl);
            return new Observable<CognitoAuth>(observer => {
              window.webContents.session.webRequest.onBeforeRequest({urls: [
                  'https://eddie-manager-apis.stag.noovolari.com/callbacks/*',
                  'https://eddie-manager-apis.demo.noovolari.com/callbacks/*',
                  'https://eddie-manager-apis.prod.noovolari.com/callbacks/*',
                  'https://eddie-manager-apis.dev.noovolari.com/callbacks/*'
                ]}, (details, callback) => {
                if (callback) { callback({cancel: true}); }
                this.getCognitoToken(details.url.split('=')[1])
                  .pipe(finalize(() => observer.complete()))
                  .subscribe(res => observer.next(res));
              });
            });
          }
        })
      );
  }
  /**
   * Return the result of the invocation of cognito for the authorization code
   * This is step one of our authorization procedure for the api requests
   * @returns an object of type: {Observable<{message: string}>}
   */
  private getAuthorizeCode(): Observable<any> {
    // Construct the Url
    const getAuthorizeUrl = this.constructAuthUrl();
    console.log(getAuthorizeUrl);
    const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
    // Make the request which makes a redirect to our callback in ordere to work properly
    return this.httpService.get(getAuthorizeUrl,  {
      headers, responseType: 'text'
    });
  }
  /**
   * Construct the cognito auth url
   * @returns the cognito auth url - {string}
   */
  private constructAuthUrl() {
    return environment.cognito.url + 'authorize?' +
      'response_type=' + environment.cognito.responseType + '&' +
      'client_id=' + environment.cognito.clientId + '&' +
      'redirect_uri=' + environment.cognito.callback + '&' +
      'scope=' + environment.cognito.scope;
  }
  /**
   * Post the information (the auth code) to Cognitop in order to retrieve the oauth2 token
   * @param authCode - the Authorization Code for cognito from the Idp provider which is the same as the one for the federation
   * @returns an observable with the same data {Observable<CognitoAuth>} as the return of the post itself
   */
  // TODO: getCognitoToken is needed.
  private getCognitoToken(authCode): Observable<CognitoAuth> {
    // Auth code
    this.appService.logger('AuthCode: ' + authCode, LoggerLevel.INFO);
    // Token Url
    const postTokenUrl = environment.cognito.url + 'token';
    // We need to force the content type for this to work
    const options = { headers: new HttpHeaders({'Content-Type' : 'application/x-www-form-urlencoded'})};
    // And we need to pass the data accordingly and NOT in a JSON type format
    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', authCode)
      .set('client_id', environment.cognito.clientId)
      .set('redirect_uri', environment.cognito.callback)
      .set('scope', environment.cognito.scope);
    // Post the information to Cognito
    return this.httpService.post<CognitoAuth>(postTokenUrl, body.toString(), options);
  }
}
