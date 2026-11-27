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
  private closeOpenWindow: () => void;

  constructor(private windowService: WindowService, private toasterService: MessageToasterService) {
    this.closeOpenWindow = () => {};
  }

  closeVerificationWindow(): void {
    this.closeOpenWindow();
  }

  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    onWindowClose: (error?: string) => void
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
    onWindowClose: (error?: string) => void
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

    // Core polls CreateToken and calls closeVerificationWindow when the login is over. Only a close
    // by the user, or after a page load error (with its text), reaches onWindowClose.
    let closedByLeapp = false;
    let loadError: string;
    this.closeOpenWindow = () => {
      if (!verificationWindow.isDestroyed()) {
        closedByLeapp = true;
        verificationWindow.close();
      }
    };
    verificationWindow.on("close", () => {
      if (!closedByLeapp) {
        onWindowClose(loadError);
      }
    });

    verificationWindow.webContents.session.webRequest.onErrorOccurred((details) => {
      if (
        details.error.indexOf("net::ERR_ABORTED") < 0 &&
        details.error.indexOf("net::ERR_FAILED") < 0 &&
        details.error.indexOf("net::ERR_CACHE_MISS") < 0 &&
        details.error.indexOf("net::ERR_CONNECTION_REFUSED") < 0 &&
        !verificationWindow.isDestroyed()
      ) {
        loadError = details.error.toString();
        verificationWindow.close();
      }
    });

    return {
      clientId: registerClientResponse.clientId,
      clientSecret: registerClientResponse.clientSecret,
      deviceCode: startDeviceAuthorizationResponse.deviceCode,
    };
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
