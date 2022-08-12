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

  abstract get actionName(): string;

  get actionIcon(): string {
    return this.metadata.icon;
  }

  abstract applySessionAction(session: Session, credentials: any): Promise<void>;
}
