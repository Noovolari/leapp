import {Injectable} from '@angular/core';
import SSOOIDC, {CreateTokenRequest, RegisterClientRequest, StartDeviceAuthorizationRequest} from 'aws-sdk/clients/ssooidc';
import SSO, {AccountInfo, ListAccountRolesRequest, ListAccountRolesResponse, ListAccountsRequest, ListAccountsResponse, RoleInfo} from 'aws-sdk/clients/sso';
import {NativeService} from '../../services-system/native-service';
import {AppService} from '../../services-system/app.service';
import {from, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Session} from '../../models/session';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {AccountType} from '../../models/AccountType';
import {v4 as uuidv4} from 'uuid';

interface AuthorizeIntegrationResponse {
  clientId: string;
  clientSecret: string;
  deviceCode: string;
}

interface GenerateSSOTokenResponse {
  accessToken: string;
}

interface LoginToAwsSSOResponse {
  accessToken: string;
  region: string;
}


@Injectable({
  providedIn: 'root'
})
export class AwsSsoService extends NativeService {

  ssooidc;
  ssoPortal;
  ssoWindow;

  constructor(private appService: AppService) {
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
        if (registerClientResponse === undefined) {
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

            if (startDeviceAuthorizationResponse === undefined) {
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

  generateSSOToken(clientId: string, clientSecret: string, deviceCode: string): Observable<GenerateSSOTokenResponse> {
    return new Observable(observer => {
      const createTokenRequest: CreateTokenRequest = {
      clientId,
      clientSecret,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode
      };

      this.ssooidc.createToken(createTokenRequest, (err, createTokenResponse) => {
        if (createTokenResponse === undefined) {
          console.log(err);
          observer.complete();
        } else {
          observer.next({accessToken: createTokenResponse.accessToken});
          observer.complete();
        }

      });
    });
  }

  loginToAwsSSO(region: string, portalUrl: string): Observable<LoginToAwsSSOResponse> {
    return this.authorizeIntegration(region, portalUrl).pipe(
          switchMap(authorizeIntegrationResponse => this.generateSSOToken(
            authorizeIntegrationResponse.clientId,
            authorizeIntegrationResponse.clientSecret,
            authorizeIntegrationResponse.deviceCode)),
          map(generateSSOTokenResponse => ({ accessToken: generateSSOTokenResponse.accessToken, region}))
    );
  }

  // PORTAL APIS


  listAccounts(accessToken: string, region: string): Observable<any> {
    this.ssoPortal = new SSO({region});
    const listAccountsRequest: ListAccountsRequest = {accessToken};
    return from(this.ssoPortal.listAccounts(listAccountsRequest).promise()).pipe( map((response: ListAccountsResponse) => ({accountList: response.accountList , accessToken, region})));
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



}

