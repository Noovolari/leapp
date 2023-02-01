import { IPlugin, IPluginMetadata } from "./interfaces/i-plugin";
import { Session } from "../models/session";
import { IPluginEnvironment } from "./interfaces/i-plugin-environment";

export abstract class AwsCredentialsPlugin implements IPlugin {
  readonly pluginType = AwsCredentialsPlugin.name;
  readonly metadata: IPluginMetadata;
  protected pluginEnvironment: IPluginEnvironment;

  constructor(pluginEnvironment: IPluginEnvironment) {
    this.pluginEnvironment = pluginEnvironment;
  }

  async run(session: Session): Promise<void> {
    const credentials = await (this.pluginEnvironment as any).generateCredentials(session);
    await this.applySessionAction(session, credentials);
  }

  /**
   * This method returns the actionName, visible to the end user from the Desktop App contextual menu and from the CLI as a command.
   */
  abstract get actionName(): string;

  /**
   * This method retrieves the value of the IPluginMetadata icon field.
   */
  get actionIcon(): string {
    return this.metadata.icon;
  }

  /**
   * This method is invoked by the AwsCredentialsPlugin run method; it expects both the Leapp Session metadata and credentials. The latter
   * are generated in the run method, prior the applySessionAction invocation.
   *
   * @param session
   * @param credentials
   */
  abstract applySessionAction(session: Session, credentials: any): Promise<void>;
}
