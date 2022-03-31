import { Injectable } from "@angular/core";
import { IAwsSamlAuthenticationService } from "@noovolari/leapp-core/interfaces/i-aws-saml-authentication-service";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";
import { AppProviderService } from "./app-provider.service";
import { WindowService } from "./window.service";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws-iam-role-federated-session";
import { constants } from "@noovolari/leapp-core/models/constants";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";
import { LoggerLevel } from "@noovolari/leapp-core/services/logging-service";
import { AppNativeService } from "./app-native.service";
import { AppService } from "./app.service";
import { Session } from "@noovolari/leapp-core/models/session";

@Injectable({ providedIn: "root" })
export class AppAwsAuthenticationService implements IAwsSamlAuthenticationService {
  constructor(
    private leappCoreService: AppProviderService,
    private appService: AppService,
    private windowService: WindowService,
    private electronService: AppNativeService,
    private messageToasterService: MessageToasterService
  ) {}

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Get active window position for extracting new windows coordinate
      const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
      const nearX = 200;
      const nearY = 50;
      // Generate a new singleton browser window for the check
      let idpWindow = this.windowService.newWindow(idpUrl, false, "", activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);

      // Our request filter call the generic hook filter passing the idp response type
      // to construct the ideal method to deal with the construction of the response
      idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (this.leappCoreService.authenticationService.isAuthenticationUrl(CloudProviderType.aws, details.url)) {
          idpWindow = null;
          resolve(true);
        }
        if (this.leappCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
          idpWindow = null;
          resolve(false);
        }
        // Callback is used by filter to keep traversing calls until one of the filters apply
        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        });
      });
      // Start the process
      idpWindow.loadURL(idpUrl);
    });
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<string> {
    // 1. Show or not browser window depending on needToAuthenticate
    const activeWindowPosition = this.windowService.getCurrentWindow().getPosition();
    const nearX = 200;
    const nearY = 50;
    // 2. Prepare browser window
    let idpWindow = this.windowService.newWindow(
      idpUrl,
      needToAuthenticate,
      "IDP - Login",
      activeWindowPosition[0] + nearX,
      activeWindowPosition[1] + nearY
    );
    // Catch filter url: extract SAML response
    // Our request filter call the generic hook filter passing the idp response type
    // to construct the ideal method to deal with the construction of the response
    return new Promise((resolve) => {
      idpWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        if (this.leappCoreService.authenticationService.isSamlAssertionUrl(CloudProviderType.aws, details.url)) {
          // it will throw an error as we have altered the original response
          // Setting that everything is ok if we have arrived here
          idpWindow.close();
          idpWindow = null;

          // Shut down the filter action: we don't need it anymore
          if (callback) {
            callback({ cancel: true });
          }

          // Return the details
          resolve(this.leappCoreService.authenticationService.extractAwsSamlResponse(details));
        } else {
          // Callback is used by filter to keep traversing calls until one of the filters apply
          callback({
            requestHeaders: details.requestHeaders,
            url: details.url,
          });
        }
      });
      // 4. Navigate to idpUrl
      idpWindow.loadURL(idpUrl);
    });
  }

  async closeAuthenticationWindow(): Promise<void> {}

  async logoutFromFederatedSession(session: Session, callback?: any): Promise<void> {
    try {
      // Clear all extra data
      const url = this.leappCoreService.repository.getIdpUrl((session as AwsIamRoleFederatedSession).idpUrlId);
      const getAppPath = this.electronService.path.join(this.electronService.app.getPath("appData"), constants.appName);
      this.electronService.rimraf.sync(getAppPath + `/Partitions/leapp-${btoa(url)}`);

      if (session) {
        const sessionService = this.leappCoreService.sessionFactory.getSessionService(session.type);
        await sessionService.stop(session.sessionId);
        if (callback) {
          callback();
        }
      }

      this.messageToasterService.toast(
        "Cache and configuration file cleaned. Stopping session and restarting Leapp to take effect.",
        ToastLevel.info,
        "Cleaning configuration file"
      );

      // Restart
      setTimeout(() => {
        // a bit of timeout to make everything reset as expected and give time to read message
        this.appService.restart();
      }, 3000);
    } catch (err) {
      this.leappCoreService.loggingService.logger(
        `Leapp has an error re-creating your configuration file and cache.`,
        LoggerLevel.error,
        this,
        err.stack
      );
      if (this.appService.detectOs() === constants.windows) {
        this.messageToasterService.toast(
          `Leapp needs Admin permissions to do this: please restart the application as an Administrator and retry.`,
          ToastLevel.warn,
          "Cleaning configuration file"
        );
      } else {
        this.messageToasterService.toast(
          `Leapp has an error re-creating your configuration file and cache.`,
          ToastLevel.error,
          "Cleaning configuration file"
        );
      }
    }
  }
}
