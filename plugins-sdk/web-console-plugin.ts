import { Session } from "@noovolari/leapp-core/models/session";
import { IPlugin, IPluginMetadata } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
import { PluginEnvironment } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { LogService } from "@noovolari/leapp-core/services/log-service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { EnvironmentType } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { IOpenExternalUrlService } from "@noovolari/leapp-core/interfaces/i-open-external-url-service";

export class WebConsolePlugin implements IPlugin {
  public metadata: IPluginMetadata;

  private logService: LogService;
  private sessionFactory: SessionFactory;
  private fetch: any;
  private openExternalUrlService: IOpenExternalUrlService;

  async bootstrap(pluginEnvironment: PluginEnvironment): Promise<void> {
    const providerService = pluginEnvironment.providerService;
    this.logService = providerService.logService;
    this.sessionFactory = providerService.sessionFactory;
    if (pluginEnvironment.environmentType === EnvironmentType.desktopApp) {
      this.fetch = providerService.appNativeService.fetch;
      this.openExternalUrlService = providerService.windowService;
    } else {
      this.fetch = providerService.cliNativeService.fetch;
      this.openExternalUrlService = providerService.cliOpenWebConsoleService;
    }
  }

  async applySessionAction(session: Session): Promise<void> {
    this.logService.log(new LoggedEntry("Opening web console for session: " + session.sessionName, this, LogLevel.info, true));

    const sessionRegion = session.region;

    //const credentialsInfo = await (this.sessionService as AwsSessionService).generateCredentials(this.session.sessionId);
    const credentialsInfo = await (this.sessionFactory.getSessionService(session.type) as AwsSessionService).generateCredentials(session.sessionId);
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

    this.logService.log(new LoggedEntry("Starting opening Web Console", this, LogLevel.info));

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
    this.openExternalUrlService.openExternalUrl(loginURL);
  }
}
