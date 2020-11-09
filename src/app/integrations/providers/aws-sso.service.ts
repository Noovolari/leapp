import {Injectable} from '@angular/core';
import SSOOIDC, {CreateTokenRequest, RegisterClientRequest, StartDeviceAuthorizationRequest} from 'aws-sdk/clients/ssooidc';
import SSO, {AccountInfo, GetRoleCredentialsRequest, GetRoleCredentialsResponse, ListAccountRolesRequest, ListAccountRolesResponse, ListAccountsRequest, ListAccountsResponse, RoleInfo} from 'aws-sdk/clients/sso';
import {NativeService} from '../../services-system/native-service';
import {AppService} from '../../services-system/app.service';
import {from, merge, Observable} from 'rxjs';
import {map, switchMap, tap, toArray} from 'rxjs/operators';
import {Session} from '../../models/session';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {AccountType} from '../../models/AccountType';
import {v4 as uuidv4} from 'uuid';
import {KeychainService} from '../../services-system/keychain.service';
import {environment} from '../../../environments/environment';
import {ConfigurationService} from '../../services-system/configuration.service';
import {fromPromise} from 'rxjs/internal-compatibility';

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


@Injectable({
  providedIn: 'root'
})
export class AwsSsoService extends NativeService {

  ssooidc;
  ssoPortal;
  ssoWindow;

  constructor(private appService: AppService,
              private keychainService: KeychainService,
              private configurationService: ConfigurationService) {
    super();
  }

  authorizeIntegration(region: string, portalUrl: string): Observable<AuthorizeIntegrationResponse> {
    this.ssooidc = new SSOOIDC({region});
    return new Observable(observer => {
      const registerClientRequest: RegisterClientRequest = {
        clientName: 'leapp',
        clientType: 'public',
      };
      this.ssooidc.registerClient(registerClientRequest, (err, registerClientResponse) => {
        if (!registerClientResponse) {
          console.log(err);
          observer.complete();
        } else {
          const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
            clientId: registerClientResponse.clientId,
            clientSecret: registerClientResponse.clientSecret,
            startUrl: portalUrl
          };
          this.ssooidc.startDeviceAuthorization(startDeviceAuthorizationRequest, (err1, startDeviceAuthorizationResponse
          ) => {
            if (!startDeviceAuthorizationResponse) {
              console.log(err1);
            } else {
              const pos = this.currentWindow.getPosition();

              this.ssoWindow = null;
              this.ssoWindow = this.appService.newWindow(startDeviceAuthorizationResponse.verificationUriComplete, true, 'Portal url - Client verification', pos[0] + 200, pos[1] + 50);
              this.ssoWindow.loadURL(startDeviceAuthorizationResponse.verificationUriComplete);

              // When the code is verified and the user has been logged in, the window can be closed
              this.ssoWindow.webContents.session.webRequest.onBeforeRequest( {urls: ['https://*.awsapps.com/start/user-consent/login-success.html']}, (details, callback) => {
                this.ssoWindow.close();
                this.ssoWindow = null;
                observer.next({clientId: registerClientResponse.clientId, clientSecret: registerClientResponse.clientSecret, deviceCode: startDeviceAuthorizationResponse.deviceCode });
                observer.complete();
              });
            }
          });
        }
      });
    });
  }

  generateSSOToken(authorizeIntegrationResponse: AuthorizeIntegrationResponse): Observable<GenerateSSOTokenResponse> {
    return new Observable(observer => {
      const createTokenRequest: CreateTokenRequest = {
      clientId: authorizeIntegrationResponse.clientId,
      clientSecret: authorizeIntegrationResponse.clientSecret,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode: authorizeIntegrationResponse.deviceCode
      };

      this.ssooidc.createToken(createTokenRequest, (err, createTokenResponse) => {
        if (createTokenResponse === undefined) {
          console.log(err);
          observer.complete();
        } else {
          let expirationTime: Date = new Date();
          expirationTime = new Date(expirationTime.getTime() + createTokenResponse.expiresIn * 1000);
          observer.next({accessToken: createTokenResponse.accessToken, expirationTime});
          observer.complete();
        }

      });
    });
  }

  firstTimeLoginToAwsSSO(region: string, portalUrl: string): Observable<LoginToAwsSSOResponse> {
    return this.authorizeIntegration(region, portalUrl).pipe(
      switchMap((authorizeIntegrationResponse: AuthorizeIntegrationResponse) => this.generateSSOToken(authorizeIntegrationResponse)),
      map(generateSSOTokenResponse => ({ accessToken: generateSSOTokenResponse.accessToken, region, expirationTime: generateSSOTokenResponse.expirationTime})),

      // whenever you are logged, then save info in keychain
      tap((response) => this.saveAwsSsoAccessInfo(portalUrl, region, response.accessToken, response.expirationTime)),

    );
  }

  loginToAwsSSO(): Observable<LoginToAwsSSOResponse> {
    let region;
    let portalUrl;
    return merge(
      fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_REGION')).pipe(tap(res => region = res)),
      fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_PORTAL_URL')).pipe(tap(res => portalUrl = res))
    ).pipe(
      switchMap(() => this.authorizeIntegration(region, portalUrl)),
      switchMap(authorizeIntegrationResponse => this.generateSSOToken(authorizeIntegrationResponse)),
      map(generateSSOTokenResponse => ({accessToken: generateSSOTokenResponse.accessToken, region, expirationTime: generateSSOTokenResponse.expirationTime})),
      // whenever try to login then dave info in keychain
      tap((response) => this.saveAwsSsoAccessInfo(portalUrl, region, response.accessToken, response.expirationTime))
    );
  }

  getAwsSsoPortalCredentials(): Observable<LoginToAwsSSOResponse> {
    const loginToAwsSSOResponse: LoginToAwsSSOResponse = {accessToken: '', expirationTime: undefined, region: ''};
    return fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME')).pipe(
      switchMap((expirationTime) => {
        if (Date.parse(expirationTime) > Date.now()) {
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
    this.keychainService.saveSecret(environment.appName, 'AWS_SSO_PORTAL_URL', portalUrl);
    this.keychainService.saveSecret(environment.appName, 'AWS_SSO_REGION', region);
    this.keychainService.saveSecret(environment.appName, 'AWS_SSO_ACCESS_TOKEN', accessToken);
    this.keychainService.saveSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME', expirationTime.toString());
  }

  // PORTAL APIS

  generateSessionsFromToken(observable: Observable<LoginToAwsSSOResponse>): Observable<Session[]> {
    return observable.pipe(
      // API portal Calls
      switchMap((loginToAwsSSOResponse) => this.listAccounts(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region)),
      // Create an array of observables and then call them in parallel,
      switchMap((response) => {
        const arrayResponse = [];
        response.accountList.forEach( accountInfo => {
          const accountInfoCall = this.getSessionsFromAccount(accountInfo, response.accessToken, response.region);
          arrayResponse.push(accountInfoCall);
        });
        return merge<Session>(...arrayResponse);
      }),
      // every call will be merged in an Array
      toArray(),
    );
  }

  listAccounts(accessToken: string, region: string): Observable<any> {
    this.ssoPortal = new SSO({region});
    const listAccountsRequest: ListAccountsRequest = {accessToken};
    return fromPromise(this.ssoPortal.listAccounts(listAccountsRequest).promise()).pipe( map((response: ListAccountsResponse) => ({accountList: response.accountList , accessToken, region})));
  }

  getSessionsFromAccount(accountInfo: AccountInfo, accessToken, region): Observable<Session> {
    this.ssoPortal = new SSO({region});
    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken
    };

    return from(this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise()).pipe(
      switchMap( (listAccountRolesResponse: ListAccountRolesResponse)  => listAccountRolesResponse.roleList ),
      map((roleInfo: RoleInfo) => {
        const account: AwsSsoAccount = {
          role: {name: roleInfo.roleName},
          accountId: accountInfo.accountId, accountName: accountInfo.accountName, accountNumber: accountInfo.accountId, email: accountInfo.emailAddress, type: AccountType.AWS_SSO
        };
        const session: Session = {
          account, active: false, id: uuidv4(), lastStopDate: new Date().toISOString(), loading: false
        };
        return session;
      })
    );
  }


  getRoleCredentials(accessToken: string, region: string, accountNumber: string, roleName: string): Observable<GetRoleCredentialsResponse> {
    this.ssoPortal = new SSO({region});
    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {accountId: accountNumber, roleName, accessToken};
    return fromPromise(this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise());
  }


  // LEAPP Integrations

  addSessionsToWorkspace(AwsSsoSessions: Session[]) {
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    // Remove all AWS SSO old session
    workspace.sessions = workspace.sessions.filter(sess => (sess.account.type !== AccountType.AWS_SSO));
    // Add new AWS SSO sessions
    workspace.sessions.push(...AwsSsoSessions);
    this.configurationService.updateWorkspaceSync(workspace);
  }
}

