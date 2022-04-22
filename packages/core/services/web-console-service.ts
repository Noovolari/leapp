import { IOpenExternalUrlService } from "../interfaces/i-open-external-url-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggerLevel, LoggingService } from "./logging-service";

export class WebConsoleService {
  private secondsInAHour = 3200;
  private sessionDurationInHours = 1;

  constructor(private shellService: IOpenExternalUrlService, private loggingService: LoggingService, private fetch: any) {}

  async openWebConsole(
    credentialsInfo: CredentialsInfo,
    sessionRegion: string,
    sessionDuration: number = this.sessionDurationInHours * this.secondsInAHour
  ): Promise<void> {
    const federationUrl = "https://signin.aws.amazon.com/federation";
    const consoleHomeURL = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;

    if (sessionRegion.startsWith("us-gov-") || sessionRegion.startsWith("cn-")) {
      throw new Error("Unsupported Region");
    }

    this.loggingService.logger(`Starting opening Web Console`, LoggerLevel.info, this);

    const sessionStringJSON = {
      sessionId: credentialsInfo.sessionToken.aws_access_key_id,
      sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,
      sessionToken: credentialsInfo.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await this.fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${(response as any).SigninToken}`;

    this.shellService.openExternalUrl(loginURL);
  }
}
