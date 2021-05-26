import {Injectable} from '@angular/core';
import SSOOIDC, {CreateTokenRequest, RegisterClientRequest, StartDeviceAuthorizationRequest} from 'aws-sdk/clients/ssooidc';
import SSO, {AccountInfo, GetRoleCredentialsRequest, GetRoleCredentialsResponse, ListAccountRolesRequest, ListAccountRolesResponse, ListAccountsRequest, ListAccountsResponse, LogoutRequest, RoleInfo} from 'aws-sdk/clients/sso';
import {NativeService} from '../native-service';
import {AppService, LoggerLevel} from '../app.service';
import {EMPTY, merge, Observable, of, throwError} from 'rxjs';
import {catchError, expand, map, switchMap, take, tap, toArray} from 'rxjs/operators';
import {Session} from '../../models/session';
import {AwsSsoSession} from '../../models/aws-sso-session';
import {SessionType} from '../../models/session-type';
import {KeychainService} from '../keychain.service';
import {environment} from '../../../environments/environment';
import {fromPromise} from 'rxjs/internal-compatibility';
import {SessionService} from '../session.service';
import {WorkspaceService} from '../workspace.service';

interface AuthorizeIntegrationResponse {
  clientId: string;
  clientSecret: string;
  deviceCode: string;
}

interface GenerateSSOTokenResponse {
  accessToken: string;
  expirationTime: Date;
}

interface LoginToAwsSSOResponse {
  accessToken: string;
  region: string;
  expirationTime: Date;
}

export interface RegisterClientResponse {
  clientId: string;
  clientSecret: string;
  clientIdIssuedAt: number;
  clientSecretExpiresAt: number;
}

export interface StartDeviceAuthorizationResponse {
  deviceCode: string;
  expiresIn: number;
  interval: number;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
}

export interface VerificationResponse {
  clientId: string;
  clientSecret: string;
  deviceCode: string;
}

export interface GenerateSsoTokenResponse {
  accessToken: string;
  expirationTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsSsoSessionProviderService extends NativeService {

  private ssooidc;


  private ssoPortal;
  private ssoWindow: any;

  constructor(private appService: AppService,
              private keychainService: KeychainService,
              private workspaceService: WorkspaceService,
              private sessionService: SessionService
              ) {
    super();
  }

  prepareSsoOidcClient(region: string): void {
    this.ssooidc = new SSOOIDC({region});
  }

  async registerClient(): Promise<RegisterClientResponse> {
    const registerClientRequest: RegisterClientRequest = {
      clientName: 'leapp',
      clientType: 'public',
    };
    return this.ssooidc.registerClient(registerClientRequest).promise();
  }

  async startDeviceAuthorization(registerClientResponse: RegisterClientResponse, portalUrl: string): Promise<StartDeviceAuthorizationResponse> {
    const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
      clientId: registerClientResponse.clientId,
      clientSecret: registerClientResponse.clientSecret,
      startUrl: portalUrl
    };
    return this.ssooidc.startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
  }

  async openVerificationBrowserWindow(registerClientResponse: RegisterClientResponse, startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse): Promise<VerificationResponse> {

    const pos = this.currentWindow.getPosition();

    this.ssoWindow = null;
    this.ssoWindow = this.appService.newWindow(startDeviceAuthorizationResponse.verificationUriComplete, true, 'Portal url - Client verification', pos[0] + 200, pos[1] + 50);
    this.ssoWindow.loadURL(startDeviceAuthorizationResponse.verificationUriComplete);

    return new Promise( (resolve, reject) => {

      // When the code is verified and the user has been logged in, the window can be closed
      this.ssoWindow.webContents.session.webRequest.onBeforeRequest({ urls: [
          'https://*.awsapps.com/start/user-consent/login-success.html',
        ] }, (details, callback) => {
        this.ssoWindow.close();
        this.ssoWindow = null;

        const verificationResponse: VerificationResponse = {
          clientId: registerClientResponse.clientId,
          clientSecret: registerClientResponse.clientSecret,
          deviceCode: startDeviceAuthorizationResponse.deviceCode
        };

        resolve(verificationResponse);

        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        });
      });

      this.ssoWindow.webContents.session.webRequest.onErrorOccurred((details) => {
        if (
          details.error.indexOf('net::ERR_ABORTED') < 0 &&
          details.error.indexOf('net::ERR_FAILED') < 0 &&
          details.error.indexOf('net::ERR_CACHE_MISS') < 0
        ) {
          if (this.ssoWindow) {
            this.ssoWindow.close();
            this.ssoWindow = null;
          }
          reject(details.error.toString());
        }
      });
    });
  }

  async createToken(verificationResponse: VerificationResponse): Promise<GenerateSSOTokenResponse> {
    const createTokenRequest: CreateTokenRequest = {
      clientId: verificationResponse.clientId,
      clientSecret: verificationResponse.clientSecret,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode: verificationResponse.deviceCode
    };

    const createTokenResponse = await this.ssooidc.createToken(createTokenRequest).promise();

    const expirationTime: Date = new Date(Date.now() + createTokenResponse.expiresIn * 1000);
    return { accessToken: createTokenResponse.accessToken, expirationTime };
  }

  loginToAwsSSO(region: string, portalUrl: string): Promise<LoginToAwsSSOResponse> {

  }
}




  loginToAwsSSO(region: string, portalUrl: string): Observable<LoginToAwsSSOResponse> {
    return new Observable<LoginToAwsSSOResponse>(observer => {
      const request = this.appService.getFollowRedirects().https.request(portalUrl, response => {
        this.authorizeIntegration(region, response.responseUrl).pipe(
          switchMap((authorizeIntegrationResponse: AuthorizeIntegrationResponse) => this.generateSSOToken(authorizeIntegrationResponse)),
          switchMap(generateSSOTokenResponse => this.saveAwsSsoAccessInfo(portalUrl, region, generateSSOTokenResponse.accessToken, generateSSOTokenResponse.expirationTime).pipe(
              map(() => ({ accessToken: generateSSOTokenResponse.accessToken, region, expirationTime: generateSSOTokenResponse.expirationTime }))
            ))
  }



  getAwsSsoPortalCredentials(): Observable<LoginToAwsSSOResponse> {
    const loginToAwsSSOResponse: LoginToAwsSSOResponse = {accessToken: '', expirationTime: undefined, region: ''};
    return fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME')).pipe(
      switchMap((expirationTime) => {
        let condition;

        try {
          condition = Date.parse(expirationTime) > Date.now();
        } catch (err) {
          return throwError(err.toString());
        }

        if (condition) {
          return merge(
            fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_ACCESS_TOKEN')).pipe(tap( res => loginToAwsSSOResponse.accessToken = res)),
            fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME')).pipe(tap( res => loginToAwsSSOResponse.expirationTime = new Date(res))),
            fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_REGION')).pipe(tap( res => loginToAwsSSOResponse.region = res)),
          ).pipe(
            toArray(),
            map(() => loginToAwsSSOResponse)
          );
        }

        return this.loginToAwsSSO();
      })
    );
  }

  saveAwsSsoAccessInfo(portalUrl: string, region: string, accessToken: string, expirationTime: Date) {
    return merge(
      fromPromise(this.keychainService.saveSecret(environment.appName, 'AWS_SSO_PORTAL_URL', portalUrl)),
      fromPromise(this.keychainService.saveSecret(environment.appName, 'AWS_SSO_REGION', region)),
      fromPromise(this.keychainService.saveSecret(environment.appName, 'AWS_SSO_ACCESS_TOKEN', accessToken)),
      fromPromise(this.keychainService.saveSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME', expirationTime.toString()))
    ).pipe(
      catchError((err) => throwError(`AWS SSO save secrets error ${err.toString()}`)),
      toArray()
    );
  }

  // PORTAL APIS

  generateSessionsFromToken(observable: Observable<LoginToAwsSSOResponse>): Observable<Session[]> {
    return observable.pipe(
      // API portal Calls
      switchMap((loginToAwsSSOResponse: LoginToAwsSSOResponse) => this.listAccounts(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region)),
      // Create an array of observables and then call them in parallel,
      switchMap((response) => {
        const arrayResponse = [];

        for (let i = 0; i < response.accountList.length; i++) {
          const accountInfo = response.accountList[i];
          const accountInfoCall = this.getSessionsFromAccount(accountInfo, response.accessToken, response.region);
          arrayResponse.push(accountInfoCall);
        }
        return merge<Session>(...arrayResponse);
      }),
      toArray()
    );
  }

  listAccounts(accessToken: string, region: string): Observable<any> {
    this.ssoPortal = new SSO({ region });
    const listAccountsRequest: ListAccountsRequest = { accessToken, maxResults: 30 };

    return fromPromise(this.ssoPortal.listAccounts(listAccountsRequest).promise()).pipe(
      expand((response: ListAccountsResponse) => {
        if (response.nextToken !== null) {
          // Add the token to the params
          listAccountsRequest['nextToken'] = response.nextToken;
          return fromPromise(this.ssoPortal.listAccounts(listAccountsRequest).promise());
        } else {
          return EMPTY;
        }
      }),
      take(300), // safety block for now
      toArray(),
      map((response: ListAccountsResponse[]) => {
        const accountListComplete = [];
        response.forEach(r => {
          accountListComplete.push(...r.accountList);
        });
        return { accountList: accountListComplete , accessToken, region };
      }),
      catchError((err) => throwError(err.toString()))
    );
  }

  getSessionsFromAccount(accountInfo: AccountInfo, accessToken, region): Observable<Session> {
    if (!accountInfo) {
      return throwError('AWS SSO Get Sessions from account error: no account info');
    }

    this.ssoPortal = new SSO({ region });
    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 2
    };

    return fromPromise(this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise()).pipe(
      expand((response: ListAccountRolesResponse) => {
        if (response.nextToken !== null) {
          // Add the token to the params
          listAccountRolesRequest['nextToken'] = response.nextToken;
          return fromPromise(this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise());
        } else {
          return EMPTY;
        }
      }),
      take(300), // safety block for now
      toArray(),
      switchMap((response: ListAccountRolesResponse[]) => {
        const rolesListAggregate: RoleInfo[] = [];
        response.forEach(r => {
          rolesListAggregate.push(...r.roleList);
        });
        return rolesListAggregate;
      }),
      map((roleInfo: RoleInfo) => {
        const profileId  = this.workspaceService.get().profiles.filter(p => p.name === 'default')[0].id;

        const account = new AwsSsoSession(
          accountInfo.accountName,
          this.workspaceService.get().defaultRegion || environment.defaultRegion,
          `arn:aws:iam::${accountInfo.accountId}/${roleInfo.roleName}`,
          profileId,
          accountInfo.emailAddress
          );

        return account;
      })
    );
  }

  getRoleCredentials(accessToken: string, region: string, accountNumber: string, roleName: string): Observable<GetRoleCredentialsResponse> {
    this.ssoPortal = new SSO({region});
    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {accountId: accountNumber, roleName, accessToken};
    return fromPromise(this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise());
  }

  // LEAPP Integrations
  addSessionsToWorkspace(awsSsoSessions: Session[]): Observable<any> {

    let oldWorkspace;

    return new Observable((observable) => {
      const workspace = this.workspaceService.get();
      oldWorkspace = workspace;

      // Remove all AWS SSO old session or create a session array
      const oldSSOsessions = this.sessionService.list().filter(sess => ((sess.type === SessionType.awsSso)));
      const newSSOSessions = awsSsoSessions.sort((a, b) => a.sessionName.toLowerCase().localeCompare(b.sessionName.toLowerCase(), 'en', {sensitivity: 'base'}));

      // Non SSO sessions
      workspace.sessions = this.sessionService.list().filter(sess => ((sess.type !== SessionType.awsSso)));

      // Add new AWS SSO sessions
      const updatedSSOSessions = [];
      newSSOSessions.forEach((newSession: Session) => {
        const found = oldSSOsessions.filter(oldSession => oldSession.sessionName === newSession.sessionName &&
            (oldSession as AwsSsoSession).roleArn.substring(14,12) === (newSession as AwsSsoSession).roleArn.substring(14,12) &&
            (oldSession as AwsSsoSession).roleArn.split('/')[1] === (newSession as AwsSsoSession).roleArn.split('/')[1])[0];
        if (found) {
          newSession = found;
        }
        updatedSSOSessions.push(newSession);
      });

      // Update all
      workspace.sessions.push(...updatedSSOSessions);
      // TODO: add session updated
      // this.workspaceService.updateSessions(workspace.sessions);

      // Verify that eventual trusters from SSO ae not pointing to deleted sessions
      const trusterSessions = this.sessionService.listTruster();
      trusterSessions.forEach(tSession => {
        // @ts-ignore
        const found = this.sessionService.get((tSession.account as AwsTrusterAccount).parentSessionId) !== undefined;
        if (!found) {
          this.sessionService.delete(tSession.sessionId);
        }
      });

      observable.next({});
      observable.complete();
    }).pipe(catchError((err) => {
      if (oldWorkspace) {
        // @ts-ignore
        // TODO: do we want a complete workspace update?
        this.workspaceService.update(oldWorkspace);
}
      return throwError(err);
    }));
  }

  logOutAwsSso(): Observable<any> {
    let awsSsoAccessToken;
    let awsSsoExpirationTime;
    let region;

    const workspace = this.workspaceService.get();
    const oldSessions = workspace.sessions;

    return merge(
      fromPromise(this.keychainService.getSecret(environment.appName, 'AWS_SSO_ACCESS_TOKEN')).pipe(tap( res => awsSsoAccessToken = res)),
      fromPromise(this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME')).pipe(tap( res => awsSsoExpirationTime = res)),
      fromPromise(this.keychainService.getSecret(environment.appName, 'AWS_SSO_REGION')).pipe(tap( res => region = res))
    ).pipe(
      toArray(),
      tap(() => {
        const logoutRequest: LogoutRequest = { accessToken: awsSsoAccessToken };
        this.ssoPortal = new SSO({region});
        return fromPromise(this.ssoPortal.logout(logoutRequest).promise());
      }),
      switchMap(() => merge(
          fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_ACCESS_TOKEN')),
          fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_EXPIRATION_TIME'))
        )),
      toArray(),
      switchMap(() =>
        // TODO: remove aws sso sessions
         of(true)
      ),
      catchError((err) => {
        const observables = [];

        if (awsSsoAccessToken) {
          observables.push(fromPromise(this.keychainService.saveSecret(environment.appName, 'AWS_SSO_ACCESS_TOKEN', awsSsoAccessToken)));
        }
        if (awsSsoExpirationTime) {
          observables.push(fromPromise(this.keychainService.saveSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME', awsSsoExpirationTime)));
        }

        return merge(...observables).pipe(
          toArray(),
          switchMap(() => {
            if (oldSessions) {
              // TODO: add oldSession to sessions
              // this.workspaceService.updateSessions(oldSessions);
            }
            return throwError(err);
          })
        );
      })
    );
  }

  isAwsSsoActive(): Observable<boolean> {
    return fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME')).pipe(
      switchMap((res) => of(Date.parse(res) > Date.now()))
    );
  }
}
