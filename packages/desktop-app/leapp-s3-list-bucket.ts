import { PluginEnvironment } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { Session } from "@noovolari/leapp-core/models/session";
import { IPlugin } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
import { IPluginMetadata } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";

export class LeappS3ListBucket implements IPlugin {
  public metadata: IPluginMetadata;

  private providerService: any;

  async bootstrap(pluginEnvironment: PluginEnvironment): Promise<void> {
    this.providerService = pluginEnvironment.providerService;
  }

  async applySessionAction(session: Session): Promise<void> {
    const service = this.providerService.sessionFactory.getSessionService(session.type);
    const credentials = await (service as AwsSessionService).generateCredentials(session.sessionId);
    const env = {
      ["AWS_ACCESS_KEY_ID"]: credentials.sessionToken.aws_access_key_id,
      ["AWS_SECRET_ACCESS_KEY"]: credentials.sessionToken.aws_secret_access_key,
      ["AWS_SESSION_TOKEN"]: credentials.sessionToken.aws_session_token,
    };

    this.providerService.executeService
      .openTerminal(`aws s3 ls`, env, "Terminal")
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
  }
}
