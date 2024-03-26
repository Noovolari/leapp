import { constants } from "@noovolari/leapp-core/models/constants";
import { Injectable } from "@angular/core";
import {
  RegisterClientResponse,
  StartDeviceAuthorizationResponse,
  VerificationResponse,
} from "@noovolari/leapp-core/services/session/aws/aws-sso-role-service";
import { IAwsSsoOidcVerificationWindowService } from "@noovolari/leapp-core/interfaces/i-aws-sso-oidc-verification-window-service";
import { WindowService } from "./window.service";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";

@Injectable({ providedIn: "root" })
export class AppVerificationWindowService implements IAwsSsoOidcVerificationWindowService {
  constructor(private windowService: WindowService, private toasterService: MessageToasterService) {}

  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    onWindowClose: () => void
  ): Promise<VerificationResponse> {
    if (startDeviceAuthorizationResponse.verificationUriComplete.indexOf("?user_code=") > -1) {
      const code = startDeviceAuthorizationResponse.verificationUriComplete.split("?user_code=")[1];
      this.windowService.authorizationDialog(code);
    }

    const openWindowInApp = constants.inApp.toString();

    if (startDeviceAuthorizationResponse.verificationUriComplete.indexOf("?user_code=") > -1) {
      const code = startDeviceAuthorizationResponse.verificationUriComplete.split("?user_code=")[1];
      this.toasterService.toast(`Your AWS user code for this SSO request is: ${code}`, ToastLevel.info, "SSO Security Code");
    }

    if (windowModality === openWindowInApp) {
      return this.openVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse, onWindowClose);
    } else {
      return this.openExternalVerificationBrowserWindow(registerClientResponse, startDeviceAuthorizationResponse);
    }
  }

  private async openVerificationBrowserWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    onWindowClose: () => void
  ): Promise<VerificationResponse> {
    const parentWindowPosition = this.windowService.getCurrentWindow().getPosition();
    const verificationWindow = this.windowService.newWindow(
      startDeviceAuthorizationResponse.verificationUriComplete,
      true,
      "Portal url - Client verification",
      parentWindowPosition[0] + 200,
      parentWindowPosition[1] + 50
    );

    verificationWindow.loadURL(startDeviceAuthorizationResponse.verificationUriComplete);
    verificationWindow.on("close", (e) => {
      e.preventDefault();
      onWindowClose();
    });

    return new Promise((resolve, reject) => {
      // When the code is verified and the user has been logged in, the window can be closed
      verificationWindow.webContents.session.webRequest.onCompleted(
        {
          urls: ["https://oidc.eu-west-1.amazonaws.com/device_authorization/associate_token"],
        },
        (details, callback) => {
          if (details.method === "POST" && details.statusCode === 200) {
            verificationWindow.close();

            const verificationResponse: VerificationResponse = {
              clientId: registerClientResponse.clientId,
              clientSecret: registerClientResponse.clientSecret,
              deviceCode: startDeviceAuthorizationResponse.deviceCode,
            };
            resolve(verificationResponse);
          }

          callback({
            requestHeaders: details.requestHeaders,
            url: details.url,
          });
        }
      );

      verificationWindow.webContents.session.webRequest.onErrorOccurred((details) => {
        if (
          details.error.indexOf("net::ERR_ABORTED") < 0 &&
          details.error.indexOf("net::ERR_FAILED") < 0 &&
          details.error.indexOf("net::ERR_CACHE_MISS") < 0 &&
          details.error.indexOf("net::ERR_CONNECTION_REFUSED") < 0
        ) {
          if (verificationWindow) {
            verificationWindow.close();
          }
          reject(details.error.toString());
        }
      });
    });
  }

  private async openExternalVerificationBrowserWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse
  ): Promise<VerificationResponse> {
    const uriComplete = startDeviceAuthorizationResponse.verificationUriComplete;
    return new Promise((resolve) => {
      // Open external browser window and let authentication begins
      this.windowService.openExternalUrl(uriComplete);

      // Return the code to be used after
      const verificationResponse: VerificationResponse = {
        clientId: registerClientResponse.clientId,
        clientSecret: registerClientResponse.clientSecret,
        deviceCode: startDeviceAuthorizationResponse.deviceCode,
      };

      resolve(verificationResponse);
    });
  }
}
