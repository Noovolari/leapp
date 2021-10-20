import {
  GenerateSSOTokenResponse,
  RegisterClientResponse,
  StartDeviceAuthorizationResponse, VerificationResponse
} from './session/aws/methods/aws-sso-role.service';
import SSOOIDC, {
  CreateTokenRequest,
  RegisterClientRequest,
  StartDeviceAuthorizationRequest
} from 'aws-sdk/clients/ssooidc';
import {Injectable} from '@angular/core';
import {Constants} from '../models/constants';
import {WorkspaceService} from './workspace.service';
import {AppService, LoggerLevel} from './app.service';
import {ElectronService} from './electron.service';
import {LeappBaseError} from '../errors/leapp-base-error';

export interface BrowserWindowClosing {
  catchClosingBrowserWindow(): void;
}

@Injectable({
  providedIn: 'root'
})
export class AwsSsoOidcService {
  listeners: BrowserWindowClosing[];
  private ssoOidc: SSOOIDC;
  private ssoWindow: any;
  private currentRegion: string;
  private currentPortalUrl: string;
  private registerClientResponse: RegisterClientResponse;
  private startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse;
  private startDeviceAuthorizationResponseExpiresAt: number;
  private generateSSOTokenResponse: GenerateSSOTokenResponse;
  private setIntervalQueue: Array<any>;
  private loginMutex: boolean;
  private timeoutOccurred: boolean;
  private interruptOccurred: boolean;
  private mainIntervalId: any;

  private index: number;

  constructor(
    private appService: AppService,
    private electronService: ElectronService,
    private workspaceService: WorkspaceService
  ) {
    this.listeners = [];
    this.ssoOidc = null;
    this.ssoWindow = null;
    this.currentRegion = null;
    this.currentPortalUrl = null;
    this.registerClientResponse = null;
    this.startDeviceAuthorizationResponse = null;
    this.startDeviceAuthorizationResponseExpiresAt = null;
    this.generateSSOTokenResponse = null;
    this.setIntervalQueue = [];
    this.loginMutex = false;
    this.timeoutOccurred = false;
    this.interruptOccurred = false;

    this.index = 0;
  }

  getAwsSsoOidcClient(): SSOOIDC {
    return this.ssoOidc;
  }

  interrupt() {
    clearInterval(this.mainIntervalId);
    this.interruptOccurred = true;
    this.loginMutex = false;
  }

  async login(region: string, portalUrl: string): Promise<GenerateSSOTokenResponse> {
    if (!this.loginMutex && this.setIntervalQueue.length === 0) {
      this.loginMutex = true;

      this.ssoOidc = new SSOOIDC({ region });
      this.ssoWindow = null;
      this.currentRegion = region;
      this.currentPortalUrl = portalUrl;
      this.registerClientResponse = null;
      this.startDeviceAuthorizationResponse = null;
      this.startDeviceAuthorizationResponseExpiresAt = null;
      this.generateSSOTokenResponse = null;
      this.setIntervalQueue = [];
      this.timeoutOccurred = false;
      this.interruptOccurred = false;

      await this.registerSsoOidcClient();

      const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
        clientId: this.registerClientResponse.clientId,
        clientSecret: this.registerClientResponse.clientSecret,
        startUrl: portalUrl
      };

      const baseTimeInMilliseconds = Date.now();
      this.startDeviceAuthorizationResponse = await this.getAwsSsoOidcClient().startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
      this.startDeviceAuthorizationResponseExpiresAt = baseTimeInMilliseconds + this.startDeviceAuthorizationResponse.expiresIn * 1000;

      const verificationResponse = await this.openVerificationBrowserWindow(this.registerClientResponse, this.startDeviceAuthorizationResponse);

      try {
        this.generateSSOTokenResponse = await this.createToken(verificationResponse);
      } catch (err) {
        this.loginMutex = false;
        throw(err);
      }

      this.loginMutex = false;

      return this.generateSSOTokenResponse;
    } else if (!this.loginMutex && this.setIntervalQueue.length > 0) {
      return this.generateSSOTokenResponse;
    } else {
      return new Promise((resolve, reject) => {
        const repeatEvery = 500; // 0.5 second, we can make these more speedy as they just check a variable, no external calls here

        const resolved = setInterval(async () => {
          if(this.interruptOccurred) {
            clearInterval(resolved);

            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
            this.setIntervalQueue.splice(resolvedIndex, 1);

            reject(new LeappBaseError('AWS SSO Interrupted', this, LoggerLevel.info, 'AWS SSO Interrupted.'));
          } else if (this.generateSSOTokenResponse) {
            clearInterval(resolved);

            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
            this.setIntervalQueue.splice(resolvedIndex, 1);

            resolve(this.generateSSOTokenResponse);
          } else if (this.timeoutOccurred) {
            clearInterval(resolved);

            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
            this.setIntervalQueue.splice(resolvedIndex, 1);

            reject(new LeappBaseError('AWS SSO Timeout', this, LoggerLevel.error, 'AWS SSO Timeout occurred. Please redo login procedure.'));
          }
        }, repeatEvery);

        this.setIntervalQueue.push(resolved);
      });
    }
  }

  private async registerSsoOidcClient(): Promise<void> {
    const registerClientRequest: RegisterClientRequest = { clientName: 'leapp', clientType: 'public' };
    this.registerClientResponse = await this.ssoOidc.registerClient(registerClientRequest).promise();
  }

  private async openVerificationBrowserWindow(registerClientResponse: RegisterClientResponse, startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse): Promise<VerificationResponse> {
    if(this.workspaceService.getAwsSsoConfiguration().browserOpening === Constants.inApp.toString()) {
      const pos = this.electronService.currentWindow.getPosition();

      this.ssoWindow = null;
      this.ssoWindow = this.appService.newWindow(startDeviceAuthorizationResponse.verificationUriComplete, true, 'Portal url - Client verification', pos[0] + 200, pos[1] + 50);
      this.ssoWindow.loadURL(startDeviceAuthorizationResponse.verificationUriComplete);

      this.ssoWindow.on('close', (e) => {
        e.preventDefault();

        this.loginMutex = false;

        this.listeners.forEach(listener => {
          listener.catchClosingBrowserWindow();
        });
      });

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
            details.error.indexOf('net::ERR_CACHE_MISS') < 0 &&
            details.error.indexOf('net::ERR_CONNECTION_REFUSED') < 0
          ) {
            if (this.ssoWindow) {
              this.ssoWindow.close();
              this.ssoWindow = null;
            }
            reject(details.error.toString());
          }
        });
      });
    } else {
      return this.openExternalVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse);
    }
  }

  private async openExternalVerificationBrowserWindow(registerClientResponse: RegisterClientResponse, startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse): Promise<VerificationResponse> {
    const uriComplete = startDeviceAuthorizationResponse.verificationUriComplete;

    return new Promise( (resolve, _) => {
      // Open external browser window and let authentication begins
      this.appService.openExternalUrl(uriComplete);

      // Return the code to be used after
      const verificationResponse: VerificationResponse = {
        clientId: registerClientResponse.clientId,
        clientSecret: registerClientResponse.clientSecret,
        deviceCode: startDeviceAuthorizationResponse.deviceCode
      };

      resolve(verificationResponse);
    });
  }

  private async createToken(verificationResponse: VerificationResponse): Promise<GenerateSSOTokenResponse> {
    const createTokenRequest: CreateTokenRequest = {
      clientId: verificationResponse.clientId,
      clientSecret: verificationResponse.clientSecret,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      deviceCode: verificationResponse.deviceCode
    };

    let createTokenResponse;

    if(this.workspaceService.getAwsSsoConfiguration().browserOpening === Constants.inApp) {
      createTokenResponse = await this.getAwsSsoOidcClient().createToken(createTokenRequest).promise();
    } else {
      createTokenResponse = await this.waitForToken(createTokenRequest);
    }

    const expirationTime: Date = new Date(Date.now() + createTokenResponse.expiresIn * 1000);
    return { accessToken: createTokenResponse.accessToken, expirationTime };
  }

  private async waitForToken(createTokenRequest: CreateTokenRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const intervalInMilliseconds = 5000;

      this.mainIntervalId = setInterval(() => {
        this.getAwsSsoOidcClient().createToken(createTokenRequest).promise().then(createTokenResponse => {
          clearInterval(this.mainIntervalId);
          resolve(createTokenResponse);
        }).catch(err => {
          if(err.toString().indexOf('AuthorizationPendingException') === -1) {
            // AWS SSO Timeout occurred
            clearInterval(this.mainIntervalId);
            this.timeoutOccurred = true;
            reject(new LeappBaseError('AWS SSO Timeout', this, LoggerLevel.error, 'AWS SSO Timeout occurred. Please redo login procedure.'));
          }
        });
      }, intervalInMilliseconds);
    });
  }
}
