import {Injectable} from '@angular/core';
import SSOOIDC, {CreateTokenRequest, RegisterClientRequest, StartDeviceAuthorizationRequest} from 'aws-sdk/clients/ssooidc';
import SSO, {AccountInfo, GetRoleCredentialsRequest, GetRoleCredentialsResponse, ListAccountRolesRequest, ListAccountsRequest, LogoutRequest, RoleInfo} from 'aws-sdk/clients/sso';
import {NativeService} from '../native-service';
import {AppService} from '../app.service';
import {KeychainService} from '../keychain.service';
import {environment} from '../../../environments/environment';
import {SessionService} from '../session.service';
import {WorkspaceService} from '../workspace.service';
import {AwsSsoService} from '../session/aws-sso.service';

export interface GenerateSSOTokenResponse {
  accessToken: string;
  expirationTime: Date;
}

export interface LoginResponse {
  accessToken: string;
  region: string;
  expirationTime: Date;
  portalUrlUnrolled: string;
}

export interface RegisterClientResponse {
  clientId?: string;
  clientSecret?: string;
  clientIdIssuedAt?: number;
  clientSecretExpiresAt?: number;
}

export interface StartDeviceAuthorizationResponse {
  deviceCode?: string;
  expiresIn?: number;
  interval?: number;
  userCode?: string;
  verificationUri?: string;
  verificationUriComplete?: string;
}

export interface VerificationResponse {
  clientId: string;
  clientSecret: string;
  deviceCode: string;
}

export interface SsoSession {
  sessionName: string;
  roleArn: string;
  email: string;
  region: string;
}

@Injectable({
  providedIn: 'root'
})
export class AwsSsoSessionProviderService extends NativeService {

  private ssoPortal: SSO;
  private ssoOidc: SSOOIDC;
  private ssoWindow: any;

  constructor(private appService: AppService,
              private keychainService: KeychainService,
              private workspaceService: WorkspaceService,
              private sessionService: SessionService
              ) {
    super();
  }

  static getProtocol(aliasedUrl: string): string {
    let protocol = aliasedUrl.split('://')[0];
    if (protocol.indexOf('http') === -1) {
      protocol = 'https';
    }
    return protocol;
  }

  async sync(region: string, portalUrl: string): Promise<SsoSession[]> {
    // Prepare Sso Client for operations
    this.getSsoOidcClient(region);
    // Get access token from either login procedure or keychain depending on being expired or not
    const accessToken = await this.getAccessToken(region, portalUrl);
    // get sessions from sso
    const sessions = await this.getSessions(accessToken, region);
    // remove all old sessions from workspace
    this.removeSsoSessionsFromWorkspace();

    return sessions;
  }

  async logout(): Promise<void> {
    // Obtain region and access token
    const region = this.workspaceService.getAwsSsoConfiguration().region;
    const savedAccessToken = await this.getAccessTokenFromKeychain();

    // Configure Sso Portal Client
    this.getSsoPortalClient(region);

    // Make a logout request to Sso
    const logoutRequest: LogoutRequest = { accessToken: savedAccessToken };
    this.ssoPortal.logout(logoutRequest).promise().then(_ => {}, _ => {
      // Delete access token and remove sso configuration info from workspace
      this.keychainService.deletePassword(environment.appName, 'aws-sso-access-token');
      this.workspaceService.removeExpirationTimeFromAwsSsoConfiguration();

      // Clean clients
      this.ssoOidc = null;
      this.ssoPortal = null;

      // Remove sessions from workspace
      this.removeSsoSessionsFromWorkspace();
    });
  }

  async getAccessToken(region: string, portalUrl: string): Promise<string> {
    if (this.ssoExpired()) {
      // Get login
      const loginResponse = await this.login(region, portalUrl);
      // Set configuration related data to workspace
      this.configureAwsSso(
        region,
        loginResponse.portalUrlUnrolled,
        loginResponse.expirationTime.toISOString(),
        loginResponse.accessToken
      );
      // Set access token
      return loginResponse.accessToken;
    } else {
      // Set access token
      return await this.getAccessTokenFromKeychain();
    }
  }

  // TODO: out of provisioning we are generating session credentials
  async getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse> {
    this.getSsoPortalClient(region);

    const getRoleCredentialsRequest: GetRoleCredentialsRequest = {
      accountId: roleArn.substring(13, 25),
      roleName: roleArn.split('/')[1],
      accessToken
    };
    return this.ssoPortal.getRoleCredentials(getRoleCredentialsRequest).promise();
  }

  async awsSsoActive(): Promise<boolean> {
    const ssoToken = await this.getAccessTokenFromKeychain();
    return !this.ssoExpired() && ssoToken !== undefined;
  }

  private ssoExpired(): boolean {
    const expirationTime = this.workspaceService.getAwsSsoConfiguration().expirationTime;
    return !expirationTime || Date.parse(expirationTime) < Date.now();
  }

  private async login(region: string, portalUrl: string): Promise<LoginResponse> {

    const followRedirectClient = this.appService.getFollowRedirects()[AwsSsoSessionProviderService.getProtocol(portalUrl)];

    portalUrl = await new Promise( (resolve, _) => {
      const request = followRedirectClient.request(portalUrl, response => resolve(response.responseUrl));
      request.end();
    });

    const registerClientResponse = await this.registerClient();
    const startDeviceAuthorizationResponse = await this.startDeviceAuthorization(registerClientResponse, portalUrl);
    const verificationResponse = await this.openVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse);
    const generateSsoTokenResponse = await this.createToken(verificationResponse);

    return { portalUrlUnrolled: portalUrl, accessToken: generateSsoTokenResponse.accessToken, region, expirationTime: generateSsoTokenResponse.expirationTime };
  }

  private async getSessions(accessToken: string, region: string): Promise<SsoSession[]> {
    const accounts: AccountInfo[] = await this.listAccounts(accessToken, region);

    const promiseArray: Promise<SsoSession[]>[] = [];

    accounts.forEach((account) => {
      promiseArray.push(this.getSessionsFromAccount(account, accessToken, region));
    });

    return new Promise( (resolve, _) => {
      Promise.all(promiseArray).then( (sessionMatrix: SsoSession[][]) => {
        resolve(sessionMatrix.flat());
      });
    });
  }

  private async getSessionsFromAccount(accountInfo: AccountInfo, accessToken: string, region: string): Promise<SsoSession[]> {
    this.getSsoPortalClient(region);
    const listAccountRolesRequest: ListAccountRolesRequest = {
      accountId: accountInfo.accountId,
      accessToken,
      maxResults: 30 // TODO: find a proper value
    };

    const accountRoles: RoleInfo[] = [];

    await new Promise((resolve, _) => {
      this.recursiveListRoles(accountRoles, listAccountRolesRequest, resolve);
    });

    const awsSsoSessions: SsoSession[] = [];

    accountRoles.forEach((accountRole) => {
      const awsSsoSession = {
        email: accountInfo.emailAddress,
        region: this.workspaceService.get().defaultRegion || environment.defaultRegion,
        roleArn: `arn:aws:iam::${accountInfo.accountId}/${accountRole.roleName}`,
        sessionName: accountInfo.accountName,
      };
      awsSsoSessions.push(awsSsoSession);
    });

    return awsSsoSessions;
  }

  private recursiveListRoles(accountRoles: RoleInfo[], listAccountRolesRequest: ListAccountRolesRequest, promiseCallback: any) {
    this.ssoPortal.listAccountRoles(listAccountRolesRequest).promise().then(response => {
      accountRoles.push(...response.roleList);

      if (response.nextToken !== null) {
        listAccountRolesRequest.nextToken = response.nextToken;
        this.recursiveListRoles(accountRoles, listAccountRolesRequest, promiseCallback);
      } else {
        promiseCallback(accountRoles);
      }
    });
  }

  private async listAccounts(accessToken: string, region: string): Promise<AccountInfo[]> {
    this.getSsoPortalClient(region);

    const listAccountsRequest: ListAccountsRequest = { accessToken, maxResults: 30 };
    const accountList: AccountInfo[] = [];

    return new Promise( (resolve, _) => {
      this.recursiveListAccounts(accountList, listAccountsRequest, resolve);
    });
  }

  private recursiveListAccounts(accountList: AccountInfo[], listAccountsRequest: ListAccountsRequest, promiseCallback: any) {
    this.ssoPortal.listAccounts(listAccountsRequest).promise().then(response => {
      accountList.push(...response.accountList);

      if (response.nextToken !== null) {
        listAccountsRequest.nextToken = response.nextToken;
        this.recursiveListAccounts(accountList, listAccountsRequest, promiseCallback);
      } else {
        promiseCallback(accountList);
      }
    });
  }

  private removeSsoSessionsFromWorkspace(): void {
    const sessions = this.sessionService.listSso();
    sessions.forEach(sess => {
      // Verify and delete eventual truster sessions from old Sso session
      const trusterSessions = this.sessionService.listTruster(sess);
      trusterSessions.forEach(session => {
          this.sessionService.delete(session.sessionId);
      });

      // Now we can safely remove
      this.workspaceService.removeSession(sess.sessionId);
    });
  }

  // TODO: check name
  private configureAwsSso(region: string, portalUrl: string, expirationTime: string, accessToken: string) {
    this.workspaceService.configureAwsSso(region, portalUrl, expirationTime);
    this.keychainService.saveSecret(environment.appName, 'aws-sso-access-token', accessToken);
  }

  private getSsoOidcClient(region: string): void {
    if (!this.ssoOidc) {
      this.ssoOidc = new SSOOIDC({region});
    }
  }

  private getSsoPortalClient(region: string): void {
    if (!this.ssoPortal) {
      this.ssoPortal = new SSO({region});
    }
  }

  private async registerClient(): Promise<RegisterClientResponse> {
    const registerClientRequest: RegisterClientRequest = {
      clientName: 'leapp',
      clientType: 'public',
    };
    return this.ssoOidc.registerClient(registerClientRequest).promise();
  }

  private async startDeviceAuthorization(registerClientResponse: RegisterClientResponse, portalUrl: string): Promise<StartDeviceAuthorizationResponse> {
    const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
      clientId: registerClientResponse.clientId,
      clientSecret: registerClientResponse.clientSecret,
      startUrl: portalUrl
    };
    return this.ssoOidc.startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
  }

  private async openVerificationBrowserWindow(registerClientResponse: RegisterClientResponse, startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse): Promise<VerificationResponse> {

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

  private async createToken(verificationResponse: VerificationResponse): Promise<GenerateSSOTokenResponse> {
    const createTokenRequest: CreateTokenRequest = {
      clientId: verificationResponse.clientId,
      clientSecret: verificationResponse.clientSecret,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode: verificationResponse.deviceCode
    };

    const createTokenResponse = await this.ssoOidc.createToken(createTokenRequest).promise();

    const expirationTime: Date = new Date(Date.now() + createTokenResponse.expiresIn * 1000);
    return { accessToken: createTokenResponse.accessToken, expirationTime };
  }

  private async getAccessTokenFromKeychain(): Promise<string> {
    return this.keychainService.getSecret(environment.appName, 'aws-sso-access-token');
  }
}
