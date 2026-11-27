import { Repository } from "./repository";
import {
  GenerateSSOTokenResponse,
  RegisterClientResponse,
  StartDeviceAuthorizationResponse,
  VerificationResponse,
} from "./session/aws/aws-sso-role-service";
import { IAwsSsoOidcVerificationWindowService } from "../interfaces/i-aws-sso-oidc-verification-window-service";
import { BrowserWindowClosing } from "../interfaces/i-browser-window-closing";
import { LoggedException, LogLevel } from "./log-service";
import { CreateTokenRequest, RegisterClientRequest, SSOOIDC, StartDeviceAuthorizationRequest } from "@aws-sdk/client-sso-oidc";

export class AwsSsoOidcService {
  public readonly listeners: BrowserWindowClosing[];
  private ssoOidc: SSOOIDC;
  private generateSSOTokenResponse: GenerateSSOTokenResponse;
  private setIntervalQueue: Array<any>;
  private mainIntervalId: any;
  private loginMutex: boolean;
  private timeoutOccurred: boolean;
  private interruptOccurred: boolean;
  private stopPolling: (error: Error) => void;

  constructor(private verificationWindowService: IAwsSsoOidcVerificationWindowService, private repository: Repository) {
    this.listeners = [];
    this.ssoOidc = null;
    this.generateSSOTokenResponse = null;
    this.setIntervalQueue = [];
    this.loginMutex = false;
    this.timeoutOccurred = false;
    this.interruptOccurred = false;
  }

  getListeners(): BrowserWindowClosing[] {
    return this.listeners;
  }

  appendListener(listener: BrowserWindowClosing): void {
    this.listeners.push(listener);
  }

  async login(configurationId: string | number, region: string, portalUrl: string): Promise<GenerateSSOTokenResponse> {
    if (!this.loginMutex && this.setIntervalQueue.length === 0) {
      this.loginMutex = true;

      this.ssoOidc = new SSOOIDC({ region });
      this.generateSSOTokenResponse = null;
      this.setIntervalQueue = [];
      this.timeoutOccurred = false;
      this.interruptOccurred = false;

      const registerClientResponse = await this.registerSsoOidcClient();
      const startDeviceAuthorizationResponse = await this.startDeviceAuthorization(registerClientResponse, portalUrl);
      const windowModality = this.repository.getAwsSsoIntegration(configurationId).browserOpening;
      try {
        const verificationResponse = await this.verificationWindowService.openVerificationWindow(
          registerClientResponse,
          startDeviceAuthorizationResponse,
          windowModality,
          (error?: string) => this.closeVerificationWindow(error)
        );
        this.generateSSOTokenResponse = await this.createToken(verificationResponse);
      } catch (err) {
        this.loginMutex = false;
        throw err;
      } finally {
        // The login is over: Leapp closes the window it opened (In-app); a no-op for a page in the user's browser.
        this.verificationWindowService.closeVerificationWindow?.();
      }

      this.loginMutex = false;
      return this.generateSSOTokenResponse;
    } else if (!this.loginMutex && this.setIntervalQueue.length > 0) {
      return this.generateSSOTokenResponse;
    } else {
      return new Promise((resolve, reject) => {
        const repeatEvery = 500; // 0.5 second, we can make these more speedy as they just check a variable, no external calls here

        const resolved = setInterval(async () => {
          if (this.interruptOccurred) {
            clearInterval(resolved);

            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
            this.setIntervalQueue.splice(resolvedIndex, 1);
            reject(new LoggedException("AWS SSO Interrupted.", this, LogLevel.info));
          } else if (this.generateSSOTokenResponse) {
            clearInterval(resolved);

            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
            this.setIntervalQueue.splice(resolvedIndex, 1);

            resolve(this.generateSSOTokenResponse);
          } else if (this.timeoutOccurred) {
            clearInterval(resolved);

            const resolvedIndex = this.setIntervalQueue.indexOf(resolved);
            this.setIntervalQueue.splice(resolvedIndex, 1);
            reject(new LoggedException("AWS SSO Timeout occurred. Please redo login procedure.", this, LogLevel.error));
          }
        }, repeatEvery);

        this.setIntervalQueue.push(resolved);
      });
    }
  }

  /** The verification window closed before the login ended: closed by the user, or `error` when the page failed to load. */
  closeVerificationWindow(error?: string): void {
    this.loginMutex = false;
    clearInterval(this.mainIntervalId);
    this.interruptOccurred = true;
    this.stopPolling?.(error ? new LoggedException(error, this, LogLevel.error) : new LoggedException("AWS SSO Interrupted.", this, LogLevel.info));

    this.getListeners().forEach((listener) => {
      listener.catchClosingBrowserWindow();
    });
  }

  interrupt(): void {
    clearInterval(this.mainIntervalId);
    this.interruptOccurred = true;
    this.loginMutex = false;
  }

  private getAwsSsoOidcClient(): SSOOIDC {
    return this.ssoOidc;
  }

  private async registerSsoOidcClient(): Promise<RegisterClientResponse> {
    const registerClientRequest: RegisterClientRequest = { clientName: "leapp", clientType: "public" };
    return await this.getAwsSsoOidcClient().registerClient(registerClientRequest);
  }

  private async startDeviceAuthorization(
    registerClientResponse: RegisterClientResponse,
    portalUrl: string
  ): Promise<StartDeviceAuthorizationResponse> {
    const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
      clientId: registerClientResponse.clientId,
      clientSecret: registerClientResponse.clientSecret,
      startUrl: portalUrl,
    };

    return await this.getAwsSsoOidcClient().startDeviceAuthorization(startDeviceAuthorizationRequest);
  }

  private async createToken(verificationResponse: VerificationResponse): Promise<GenerateSSOTokenResponse> {
    const createTokenRequest: CreateTokenRequest = {
      clientId: verificationResponse.clientId,
      clientSecret: verificationResponse.clientSecret,
      grantType: "urn:ietf:params:oauth:grant-type:device_code",
      deviceCode: verificationResponse.deviceCode,
    };

    // Every modality polls CreateToken: the In-app window no longer watches the AWS page's own requests.
    const createTokenResponse = await this.waitForToken(createTokenRequest);

    const expirationTime: Date = new Date(Date.now() + createTokenResponse.expiresIn * 1000);
    return { accessToken: createTokenResponse.accessToken, expirationTime };
  }

  private async waitForToken(createTokenRequest: CreateTokenRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const intervalInMilliseconds = 5000;
      this.stopPolling = reject;

      this.mainIntervalId = setInterval(() => {
        this.getAwsSsoOidcClient()
          .createToken(createTokenRequest)
          .then((createTokenResponse) => {
            clearInterval(this.mainIntervalId);
            resolve(createTokenResponse);
          })
          .catch((err) => {
            if (err.toString().indexOf("AuthorizationPendingException") === -1) {
              // AWS SSO Timeout occurred
              clearInterval(this.mainIntervalId);
              this.timeoutOccurred = true;
              reject(new LoggedException("AWS SSO Timeout occurred. Please redo login procedure.", this, LogLevel.error));
            }
          });
      }, intervalInMilliseconds);
    });
  }
}
