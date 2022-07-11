import { IPlugin, IPluginFormObject, IPluginOutputObject } from "@noovolari/leapp-core/plugin-system/interfaces/IPlugin";
import { Session } from "@noovolari/leapp-core/models/session";
import { PluginCoreService } from "@noovolari/leapp-core/plugin-system/plugin-core-service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";

export class LeappS3ListBucket implements IPlugin {
  active: false;
  description: "list S3 bucket from Leapp Session";
  name: "Leapp S3 Bucket list";
  supportedOS: ["macOS", "Windows", "Linux"];
  tags: ["leapp-plugin", "s3", "list buckets"];
  templateStructure: { form: IPluginFormObject[]; output: IPluginOutputObject };
  url: "";
  author: "Frank Nora & Alessandro Gubbio";

  private session: Session;
  private pluginCoreService: PluginCoreService;

  boostrap(session: Session, pluginCoreService: PluginCoreService): any {
    this.session = session;
    this.pluginCoreService = pluginCoreService;
    this.templateStructure = { form: [], output: null };
  }

  async applyAction(): Promise<any> {
    const service = this.pluginCoreService.sessionFactory.getSessionService(this.session.type);
    const credentials = await (service as AwsSessionService).generateCredentials(this.session.sessionId);
    const env = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_ACCESS_KEY_ID: credentials.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SECRET_ACCESS_KEY: credentials.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SESSION_TOKEN: credentials.sessionToken.aws_session_token,
    };

    this.pluginCoreService.executeService
      .openTerminal(`aws s3 ls`, env, "Terminal")
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
  }
}
