import {Injectable} from '@angular/core';
import SSOOIDC, {CreateTokenRequest, RegisterClientRequest, StartDeviceAuthorizationRequest} from 'aws-sdk/clients/ssooidc';
import SSO, {AccountInfo, GetRoleCredentialsRequest, GetRoleCredentialsResponse, ListAccountRolesRequest, ListAccountRolesResponse, ListAccountsRequest, ListAccountsResponse, RoleInfo, LogoutRequest} from 'aws-sdk/clients/sso';
import {NativeService} from '../../services-system/native-service';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {EMPTY, merge, Observable, of, throwError} from 'rxjs';
import {catchError, delay, expand, map, retryWhen, switchMap, take, tap, toArray} from 'rxjs/operators';
import {Session} from '../../models/session';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {AccountType} from '../../models/AccountType';
import {v4 as uuidv4} from 'uuid';
import {KeychainService} from '../../services-system/keychain.service';
import {environment} from '../../../environments/environment';
import {ConfigurationService} from '../../services-system/configuration.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Workspace} from '../../models/workspace';
import {SessionService} from '../../services/session.service';

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
              private sessionService: SessionService
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
              this.appService.logger('AWS SSO device authorization error.', LoggerLevel.ERROR, this, err.stack);
              this.appService.toast('Error in device authorization', ToastLevel.ERROR, 'AWS Single Sign-On');
              return throwError('AWS SSO device authorization error.');
            }),
            switchMap((startDeviceAuthorizationResponse: any) => {
              return new Observable<AuthorizeIntegrationResponse>((observer) => {
                if (!startDeviceAuthorizationResponse) {
                  observer.error('AWS SSO device authorization error.');
                } else {
                  this.appService.openExternalUrl(startDeviceAuthorizationResponse.verificationUriComplete);
                  observer.next({
                    clientId: registerClientResponse.clientId,
                    clientSecret: registerClientResponse.clientSecret,
                    deviceCode: startDeviceAuthorizationResponse.deviceCode
                  });
                  observer.complete();
                }
              });
            })
          );
        }
      }),
      catchError((err) => {
        return throwError(err.toString());
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

    return of(true).pipe(
      switchMap(() => fromPromise(this.ssooidc.createToken(createTokenRequest).promise())),
      map((createTokenResponse: any) => {
          if (!createTokenResponse) {
           throw new Error('AWS SSO token creation error...');
          } else {
            let expirationTime: Date = new Date();
            expirationTime = new Date(expirationTime.getTime() + createTokenResponse.expiresIn * 1000);
            return { accessToken: createTokenResponse.accessToken, expirationTime };
        }
      }),
      retryWhen(errors =>
        errors.pipe(switchMap(err => {
          if (err.code === 'AuthorizationPendingException') {
            return of(true).pipe(delay(5000));
          } else {
            this.appService.logger('AWS SSO Generating token exception.', LoggerLevel.ERROR, this, err.stack);
            this.appService.toast('Error in generating token', ToastLevel.ERROR, 'AWS Single Sign-On');
            return throwError(err);
          }
        })
      ))
    );
  }

  firstTimeLoginToAwsSSO(region: string, portalUrl: string): Observable<LoginToAwsSSOResponse> {
    return this.authorizeIntegration(region, portalUrl).pipe(
      tap(console.log),
      switchMap((authorizeIntegrationResponse: AuthorizeIntegrationResponse) => this.generateSSOToken(authorizeIntegrationResponse)),
      tap(console.log),
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
      catchError ((err)  => {
        this.appService.logger(`AWS SSO in loginToAwsSSO:  ${err.toString()}`, LoggerLevel.ERROR, this, err.stack);
        return throwError(`AWS SSO in loginToAwsSSO: ${err.toString()}`);
      }),
      switchMap(() => this.authorizeIntegration(region, portalUrl)),
      tap(console.log),
      switchMap(authorizeIntegrationResponse => this.generateSSOToken(authorizeIntegrationResponse)),
      tap(console.log),
      map(generateSSOTokenResponse => ({accessToken: generateSSOTokenResponse.accessToken, region, expirationTime: generateSSOTokenResponse.expirationTime})),
      // whenever try to login then dave info in keychain
      switchMap((response) => {
        return this.saveAwsSsoAccessInfo(portalUrl, region, response.accessToken, response.expirationTime).pipe(
          map(() => {
            return { accessToken: response.accessToken, region, expirationTime: response.expirationTime };
          })
        );
      })
    );
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
      catchError((err) => {
        return throwError(`AWS SSO save secrets error ${err.toString()}`);
      }),
      toArray()
    );
  }

  // PORTAL APIS

  generateSessionsFromToken(observable: Observable<LoginToAwsSSOResponse>): Observable<Session[]> {
    return observable.pipe(
      // API portal Calls
      switchMap((loginToAwsSSOResponse: LoginToAwsSSOResponse) => {
        return this.listAccounts(loginToAwsSSOResponse.accessToken, loginToAwsSSOResponse.region);
      }),
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
      catchError((err) => {
        return throwError(err.toString());
      })
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
        const account: AwsSsoAccount = {
          region: this.configurationService.getDefaultWorkspaceSync().defaultRegion || environment.defaultRegion,
          role: {name: roleInfo.roleName},
          accountId: accountInfo.accountId,
          accountName: accountInfo.accountName,
          accountNumber: accountInfo.accountId,
          email: accountInfo.emailAddress,
          type: AccountType.AWS_SSO
        };

        const workspace  = this.configurationService.getDefaultWorkspaceSync();
        const profiles   = workspace.profiles;
        const profileId  = profiles.filter(p => p.name === 'default')[0].id;

        const session: Session = {
          account,
          profile: profileId,
          active: false,
          id: uuidv4(),
          lastStopDate: new Date().toISOString(),
          loading: false,
          complete: false
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
  addSessionsToWorkspace(AwsSsoSessions: Session[]): Observable<any> {
    let oldConfiguration;
    let oldWorkspace;

    return new Observable((observable) => {
      let workspace = this.configurationService.getDefaultWorkspaceSync();
      oldWorkspace = workspace;

      // If sessions does not exist create the sessions array
      if (JSON.stringify(workspace) === '{}') {
        // Set the configuration with the updated value
        const configuration = this.configurationService.getConfigurationFileSync();
        oldConfiguration = configuration;

        configuration.workspaces = configuration.workspaces ? configuration.workspaces : [];

        const workspaceCreation: Workspace = {
          defaultLocation: environment.defaultLocation,
          defaultRegion: environment.defaultRegion,
          type: null,
          name: 'default',
          lastIDPToken: null,
          idpUrl: [],
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

      // Remove all AWS SSO old session or create a session array
      const oldSSOsessions = this.sessionService.listSessions().filter(sess => ((sess.account.type === AccountType.AWS_SSO)));
      const newSSOSessions = AwsSsoSessions.sort((a, b) => {
        return a.account.accountName.toLowerCase().localeCompare(b.account.accountName.toLowerCase(), 'en', {sensitivity: 'base'});
      });

      // Non SSO sessions
      workspace.sessions = this.sessionService.listSessions().filter(sess => ((sess.account.type !== AccountType.AWS_SSO)));

      // Add new AWS SSO sessions
      const updatedSSOSessions = [];
      newSSOSessions.forEach((newSession: Session) => {
        const found = oldSSOsessions.filter(oldSession => {
          return oldSession.account.accountName === newSession.account.accountName &&
                 oldSession.account.accountNumber === (newSession.account as AwsSsoAccount).accountNumber &&
                 oldSession.account.role.name === (newSession.account as AwsSsoAccount).role.name;
        })[0];
        if (found) {
          newSession = found;
        }
        updatedSSOSessions.push(newSession);
      });

      // Update all
      workspace.sessions.push(...updatedSSOSessions);
      this.configurationService.updateWorkspaceSync(workspace);

      // Verify that eventual trusters from SSO ae not pointing to deleted sessions
      const trusterSessions = this.sessionService.listTrusterSessions();
      trusterSessions.forEach(tSession => {
        const found = this.sessionService.getSession(tSession.account.parent) !== undefined;
        if (!found) {
          this.sessionService.removeSession(tSession);
        }
      });

      observable.next({});
      observable.complete();
    }).pipe(catchError((err) => {
      if (oldWorkspace) { this.configurationService.updateWorkspaceSync(oldWorkspace); }
      if (oldConfiguration) { this.configurationService.updateConfigurationFileSync(oldConfiguration); }
      return throwError(err);
    }));
  }

  logOutAwsSso(): Observable<any> {
    let awsSsoAccessToken;
    let awsSsoExpirationTime;
    let region;

    const workspace = this.configurationService.getDefaultWorkspaceSync();
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
      switchMap(() => {
        return merge(
          fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_ACCESS_TOKEN')),
          fromPromise(this.keychainService.deletePassword(environment.appName, 'AWS_SSO_EXPIRATION_TIME'))
        );
      }),
      toArray(),
      switchMap(() => {
        workspace.sessions = workspace.sessions.filter(sess => (sess.account.type !== AccountType.AWS_SSO));
        this.configurationService.updateWorkspaceSync(workspace);
        return of(true);
      }),
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
              workspace.sessions = oldSessions;
              this.configurationService.updateWorkspaceSync(workspace);
            }
            return throwError(err);
          })
        );
      })
    );
  }

  isAwsSsoActive(): Observable<boolean> {
    return fromPromise<string>(this.keychainService.getSecret(environment.appName, 'AWS_SSO_EXPIRATION_TIME')).pipe(
      switchMap((res) => {
        return of(Date.parse(res) > Date.now());
      })
    );
  }
}
