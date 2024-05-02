import { IOpenExternalUrlService } from "../interfaces/i-open-external-url-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggedEntry, LogLevel, LogService } from "./log-service";
import { INativeService } from "../interfaces/i-native-service";

export class WebConsoleService {
  private secondsInAHour = 3600;
  private sessionDurationInHours = 12;

  constructor(private shellService: IOpenExternalUrlService, private logService: LogService, private nativeService: INativeService) {}

  async getWebConsoleUrl(
    credentialsInfo: CredentialsInfo,
    sessionRegion: string,
    sessionDuration: number = this.sessionDurationInHours * this.secondsInAHour
  ): Promise<string> {
    const isUSGovCloud = sessionRegion.startsWith("us-gov-");

    let consoleHomeUrl;
    let signInUrl;

    if (!isUSGovCloud) {
      signInUrl = "https://us-east-1.signin.aws.amazon.com";
      consoleHomeUrl = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;
    } else {
      signInUrl = "https://us-east-1.signin.amazonaws-us-gov.com";
      consoleHomeUrl = `https://console.amazonaws-us-gov.com/console/home?region=${sessionRegion}`;
    }

    const federationUrl = `${signInUrl}/federation`;
    const oAuthUrl = `${signInUrl}/oauth`;

    if (sessionRegion.startsWith("cn-")) {
      throw new Error("Unsupported Region");
    }

    this.logService.log(new LoggedEntry("Getting Web Console Url", this, LogLevel.info));

    const sessionStringJSON = {
      sessionId: credentialsInfo.sessionToken.aws_access_key_id,
      sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,
      sessionToken: credentialsInfo.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await this.nativeService.fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const redirectUrl = new URL(federationUrl);
    redirectUrl.searchParams.append("Action", "login");
    redirectUrl.searchParams.append("Issuer", "Leapp");
    redirectUrl.searchParams.append("Destination", consoleHomeUrl);
    redirectUrl.searchParams.append("SigninToken", (response as any).SigninToken);

    const webConsoleUrl = new URL(oAuthUrl);
    webConsoleUrl.searchParams.append("Action", "logout");
    webConsoleUrl.searchParams.append("redirect_uri", redirectUrl.toString());

    return webConsoleUrl.toString();
  }

  async openWebConsole(
    credentialsInfo: CredentialsInfo,
    sessionRegion: string,
    sessionDuration: number = this.sessionDurationInHours * this.secondsInAHour
  ): Promise<void> {
    const loginURL = await this.getWebConsoleUrl(credentialsInfo, sessionRegion, sessionDuration);
    this.logService.log(new LoggedEntry("Opening Web Console in browser", this, LogLevel.info));
    this.shellService.openExternalUrl(loginURL);
  }
}
