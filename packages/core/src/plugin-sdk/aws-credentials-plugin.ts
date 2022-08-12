import { IPlugin, IPluginMetadata } from "./interfaces/i-plugin";
import { Session } from "../models/session";
import { PluginEnvironment } from "./plugin-environment";
import { SessionFactory } from "../services/session-factory";
import { AwsSessionService } from "../services/session/aws/aws-session-service";

export abstract class AwsCredentialsPlugin implements IPlugin {
  readonly pluginType = AwsCredentialsPlugin.name;
  readonly metadata: IPluginMetadata;
  protected pluginEnvironment: PluginEnvironment;
  private sessionFactory: SessionFactory;

  constructor(pluginEnvironment: PluginEnvironment, sessionFactory: SessionFactory) {
    this.pluginEnvironment = pluginEnvironment;
    this.sessionFactory = sessionFactory;
  }

  async run(session: Session): Promise<void> {
    const sessionService = this.sessionFactory.getSessionService(session.type) as unknown as AwsSessionService;
    const credentials = await sessionService.generateCredentials(session.sessionId);
    await this.applySessionAction(session, credentials);
  }

  abstract get actionName(): string;

  get actionIcon(): string {
    return this.metadata.icon;
  }

  abstract applySessionAction(session: Session, credentials: any): Promise<void>;
}
