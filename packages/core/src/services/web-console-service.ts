import { IOpenExternalUrlService } from "../interfaces/i-open-external-url-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggedEntry, LogLevel, LogService } from "./log-service";
import { INativeService } from "../interfaces/i-native-service";

export class WebConsoleService {
  private secondsInAHour = 3200;
  private sessionDurationInHours = 1;

  constructor(private shellService: IOpenExternalUrlService, private logService: LogService, private nativeService: INativeService) {}

  async getWebConsoleUrl(
    credentialsInfo: CredentialsInfo,
    sessionRegion: string,
    sessionDuration: number = this.sessionDurationInHours * this.secondsInAHour
  ): Promise<string> {
    const isUSGovCloud = sessionRegion.startsWith("us-gov-");

    let federationUrl;
    let consoleHomeURL;

    if (!isUSGovCloud) {
      federationUrl = "https://signin.aws.amazon.com/federation";
      consoleHomeURL = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;
    } else {
      federationUrl = "https://signin.amazonaws-us-gov.com/federation";
      consoleHomeURL = `https://console.amazonaws-us-gov.com/console/home?region=${sessionRegion}`;
    }

    if (sessionRegion.startsWith("cn-")) {
      throw new Error("Unsupported Region");
    }

    this.logService.log(new LoggedEntry("Getting Web Console Url", this, LogLevel.info));

    const sessionStringJSON = {
      sessionId: credentialsInfo.sessionToken.aws_access_key_id,
      sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,
      sessionToken: credentialsInfo.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&sessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await this.nativeService.fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    return `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${(response as any).SigninToken}`;
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
