import {Injectable} from '@angular/core';
import SSOOIDC, {
  CreateTokenRequest,
  RegisterClientRequest,
  StartDeviceAuthorizationRequest
} from 'aws-sdk/clients/ssooidc';
import SSO, {
  AccountInfo,
  GetRoleCredentialsRequest,
  GetRoleCredentialsResponse,
  ListAccountRolesRequest,
  ListAccountRolesResponse,
  ListAccountsRequest,
  ListAccountsResponse,
  RoleInfo
} from 'aws-sdk/clients/sso';
import {NativeService} from '../../services-system/native-service';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {from, merge, NEVER, never, Observable, of, throwError} from 'rxjs';
import {catchError, filter, map, switchMap, tap, toArray} from 'rxjs/operators';
import {Session} from '../../models/session';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {AccountType} from '../../models/AccountType';
import {v4 as uuidv4} from 'uuid';
import {KeychainService} from '../../services-system/keychain.service';
import {environment} from '../../../environments/environment';
import {ConfigurationService} from '../../services-system/configuration.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Workspace} from '../../models/workspace';
import {type} from 'os';

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
              private configurationService: ConfigurationService,
              ) {
    super();
  }

  authorizeIntegration(region: string, portalUrl: string): Observable<AuthorizeIntegrationResponse> {
    this.ssooidc = new SSOOIDC({region});

    const registerClientRequest: RegisterClientRequest = {
      clientName: 'leapp',
      clientType: 'public',
    };

    return fromPromise(this.ssooidc.registerClient(registerClientRequest).promise()).pipe(
      catchError((err) => {
        return throwError('AWS SSO client registration error.');
      }),
      switchMap((registerClientResponse: any) => {
        if (!registerClientResponse) {
          return throwError('AWS SSO client registration error.');
        } else {
          const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
            clientId: registerClientResponse.clientId,
            clientSecret: registerClientResponse.clientSecret,
            startUrl: portalUrl
          };

          return fromPromise(this.ssooidc.startDeviceAuthorization(startDeviceAuthorizationRequest).promise()).pipe(
            catchError((err) => {
              return throwError('AWS SSO device authorization error.');
            }),
            switchMap((startDeviceAuthorizationResponse: any) => {
              return new Observable<AuthorizeIntegrationResponse>((observer) => {
                if (!startDeviceAuthorizationResponse) {
                  observer.error('AWS SSO device authorization error.');
                } else {
                  const pos = this.currentWindow.getPosition();

                  this.ssoWindow = null;
                  this.ssoWindow = this.appService.newWindow(startDeviceAuthorizationResponse.verificationUriComplete, true, 'Portal url - Client verification', pos[0] + 200, pos[1] + 50);
                  this.ssoWindow.loadURL(startDeviceAuthorizationResponse.verificationUriComplete);

                  // TODO: handle webRequest error with setTimeout (webRequest on Timeout)

                  // When the code is verified and the user has been logged in, the window can be closed
                  this.ssoWindow.webContents.session.webRequest.onBeforeRequest({ urls: ['https://*.awsapps.com/start/user-consent/login-success.html'] }, () => {
                    this.ssoWindow.close();
                    this.ssoWindow = null;

                    observer.next({
                      clientId: registerClientResponse.clientId,
                      clientSecret: registerClientResponse.clientSecret,
                      deviceCode: startDeviceAuthorizationResponse.deviceCode
                    });

                    observer.complete();
                  });
                }
              });
            })
          );
        }
      })
    );
  }

  // Generate the access token that is valid for 8 hours
  generateSSOToken(authorizeIntegrationResponse: AuthorizeIntegrationResponse): Observable<GenerateSSOTokenResponse> {
    const createTokenRequest: CreateTokenRequest = {
      clientId: authorizeIntegrationResponse.clientId,
      clientSecret: authorizeIntegrationResponse.clientSecret,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode: authorizeIntegrationResponse.deviceCode
    };

    return fromPromise(this.ssooidc.createToken(createTokenRequest).promise()).pipe(
      catchError((err) => {
        return throwError('AWS SSO token creation error...');
      }),
      switchMap((createTokenResponse: any) => {
        return new Observable<GenerateSSOTokenResponse>((observer) => {
          if (!createTokenResponse) {
            observer.error('AWS SSO token creation error...');
          } else {
            let expirationTime: Date = new Date();
            expirationTime = new Date(expirationTime.getTime() + createTokenResponse.expiresIn * 1000);
            observer.next({ accessToken: createTokenResponse.accessToken, expirationTime });
            observer.complete();
          }
        });
      })
    );
  }

  firstTimeLoginToAwsSSO(region: string, portalUrl: string): Observable<LoginToAwsSSOResponse> {
    return this.authorizeIntegration(region, portalUrl).pipe(
      switchMap((authorizeIntegrationResponse: AuthorizeIntegrationResponse) => this.generateSSOToken(authorizeIntegrationResponse)),
      switchMap(generateSSOTokenResponse => {
        return this.saveAwsSsoAccessInfo(portalUrl, region, generateSSOTokenResponse.accessToken, generateSSOTokenResponse.expirationTime).pipe(
          map(() => ({ accessToken: generateSSOTokenResponse.accessToken, region, expirationTime: generateSSOTokenResponse.expirationTime }))
        );
      })
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
        try {
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
        } catch (err) {
          return throwError('AWS SSO in getAwsSsoPortalCredentials.');
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
      catchError((err) => {
        return throwError('AWS SSO save secrets error.');
      })
    );
  }

  // PORTAL APIS

  generateSessionsFromToken(observable: Observable<LoginToAwsSSOResponse>): Observable<Session[]> {
    return observable.pipe(
      catchError( (err) => {
        return throwError(`AWS SSO generateSessionsFromToken: ${err.toString()}`);
      }),
      // API portal Calls
      switchMap((loginToAwsSSOResponse: LoginToAwsSSOResponse) => this.listAccounts(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region)),
      // Create an array of observables and then call them in parallel,
      switchMap((response) => {
        const arrayResponse = [];
        console.log('HERE 1: ', response);
        for (let i = 0; i < response.accountList.length; i++) {
          const accountInfo = response.accountList[i];
          const accountInfoCall = this.getSessionsFromAccount(accountInfo, response.accessToken, response.region);
          arrayResponse.push(accountInfoCall);
        }
        return merge<Session>(...arrayResponse);
      }),
      // every call will be merged in an Array
      toArray(),
      catchError( (err) => {
        return throwError(`AWS SSO generateSessionsFromToken: ${err.toString()}`);
      })
    );
  }

  listAccounts(accessToken: string, region: string): Observable<any> {
    this.ssoPortal = new SSO({ region });
    const listAccountsRequest: ListAccountsRequest = { accessToken };
    return fromPromise(this.ssoPortal.listAccounts(listAccountsRequest).promise()).pipe(
      catchError((err) => {
        return throwError('AWS SSO list accounts error.');
      }),
      map((response: ListAccountsResponse) => ({ accountList: response.accountList , accessToken, region }))
    );
  }

  getSessionsFromAccount(accountInfo: AccountInfo, accessToken, region): Observable<Session> {
    if (!accountInfo) {
      console.log('HERE 3b');
      return throwError('AWS SSO Get Sessions from account error: no account info');
    }

    this.ssoPortal = new SSO({region});
    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken
    };

    return from(this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise()).pipe(
      switchMap( (listAccountRolesResponse: ListAccountRolesResponse)  => {
        if (!listAccountRolesResponse) {
          console.log('HERE 4');
          return throwError('AWS SSO error in Get Sessions from account: null list account response');
        }
        console.log('quaggiù');
        return listAccountRolesResponse.roleList;
      }),
      map((roleInfo: RoleInfo) => {
        const account: AwsSsoAccount = {
          role: {name: roleInfo.roleName},
          accountId: accountInfo.accountId,
          accountName: accountInfo.accountName,
          accountNumber: accountInfo.accountId,
          email: accountInfo.emailAddress,
          type: AccountType.AWS_SSO
        };
        const session: Session = {
          account,
          active: false,
          id: uuidv4(),
          lastStopDate: new Date().toISOString(),
          loading: false
        };
        console.log('HERE 5');
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
    let workspace = this.configurationService.getDefaultWorkspaceSync();

    // If sessions does not exist create the sessions array
    // TODO: remove
    try {
      if (JSON.stringify(workspace) === '{}') {
        // Set the configuration with the updated value
        const configuration = this.configurationService.getConfigurationFileSync();
        // TODO: we need more than one workspace?
        configuration.workspaces = configuration.workspaces ? configuration.workspaces : [];
        const workspaceCreation: Workspace = {
          type: null,
          name: 'default',
          lastIDPToken: null,
          idpUrl: null,
          proxyConfiguration: { proxyPort: '8080', proxyProtocol: 'https', proxyUrl: '', username: '', password: '' },
          sessions: [],
          setupDone: true,
          azureProfile: null,
          azureConfig: null
        };
        configuration.defaultWorkspace = 'default';
        configuration.workspaces.push(workspaceCreation);
        this.configurationService.updateConfigurationFileSync(configuration);
        workspace = workspaceCreation;
      }
    } catch (err) {
      this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
      this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');
      return;
    }
    // Remove all AWS SSO old session or create a session array
    workspace.sessions = workspace.sessions.filter(sess => ((sess.account.type !== AccountType.AWS_SSO)));
    // Add new AWS SSO sessions
    workspace.sessions.push(...AwsSsoSessions);
    this.configurationService.updateWorkspaceSync(workspace);
  }

  logOutAwsSso() {
    try {
      this.keychainService.deletePassword(environment.appName, 'AWS_SSO_ACCESS_TOKEN');
      this.keychainService.deletePassword(environment.appName, 'AWS_SSO_EXPIRATION_TIME');

      const workspace = this.configurationService.getDefaultWorkspaceSync();

      // Remove all AWS SSO old session
      workspace.sessions = workspace.sessions.filter(sess => (sess.account.type !== AccountType.AWS_SSO));

      this.configurationService.updateWorkspaceSync(workspace);
    } catch (err) {
      this.appService.logger(err.toString(), LoggerLevel.ERROR, this, err.stack);
      this.appService.toast(`${err.toString()}; please check the log files for more information.`, ToastLevel.ERROR, 'AWS SSO error.');
    }
  }

  isAwsSsoActive(): Observable<boolean> {
    return fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_PORTAL_URL')).pipe(
      map((res) => !!res)
    );
  }
}
