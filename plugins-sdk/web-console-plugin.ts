import { Session } from "@noovolari/leapp-core/models/session";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { AwsSessionService } from "../packages/core/dist/services/session/aws/aws-session-service";

export class WebConsolePlugin {
  public metadata: any;

  private providerService: any;

  async bootstrap(pluginEnvironment: any): Promise<void> {
    this.providerService = pluginEnvironment.providerService;
  }

  async applySessionAction(session: Session): Promise<void> {
    this.providerService.logService.log(new LoggedEntry("Opening web console for session: " + session.sessionName, this, LogLevel.info, true));

    console.log(session.sessionId);

    const sessionRegion = session.region;

    //const credentialsInfo = await (this.sessionService as AwsSessionService).generateCredentials(this.session.sessionId);
    const credentialsInfo = await (this.providerService.sessionFactory.getSessionService(session.type) as AwsSessionService).generateCredentials(
      session.sessionId
    );
    const sessionDuration = 3200;

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

    this.providerService.logService.log(new LoggedEntry("Starting opening Web Console", this, LogLevel.info));

    const sessionStringJSON = {
      sessionId: credentialsInfo.sessionToken.aws_access_key_id,
      sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,
      sessionToken: credentialsInfo.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${(response as any).SigninToken}`;

    //this.providerService.shellService.openExternalUrl(loginUrl);
    this.providerService.windowService.openExternalUrl(loginURL);
  }
}
