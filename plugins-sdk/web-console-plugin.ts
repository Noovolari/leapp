import { Session } from "@noovolari/leapp-core/models/session";
import { PluginEnvironment, PluginLogLevel } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-system/aws-credentials-plugin";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";

export class WebConsolePlugin extends AwsCredentialsPlugin {

  constructor(pluginEnvironment: PluginEnvironment, sessionFactory: SessionFactory) {
    super(pluginEnvironment, sessionFactory);
  }

  async applySessionAction(session: Session, credentials: any): Promise<void> {
    this.pluginEnvironment.log("Opening web console for session: " + session.sessionName, PluginLogLevel.info);

    const sessionRegion = session.region;
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

    this.pluginEnvironment.log("Starting opening Web Console", PluginLogLevel.info);

    const sessionStringJSON = {
      sessionId: credentials.sessionToken.aws_access_key_id,
      sessionKey: credentials.sessionToken.aws_secret_access_key,
      sessionToken: credentials.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await this.pluginEnvironment.fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${(response as any).SigninToken}`;
    this.pluginEnvironment.openExternalUrl(loginURL);
  }
}
