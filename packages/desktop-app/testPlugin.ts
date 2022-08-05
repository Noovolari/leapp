import { PluginEnvironment } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { Session } from "@noovolari/leapp-core/models/session";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { EnvironmentType } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { IPlugin } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
import { IPluginMetadata } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";

export class HelloWorldPlugin implements IPlugin {
  public metadata: IPluginMetadata;

  private providerService: any;

  async bootstrap(pluginEnvironment: PluginEnvironment): Promise<void> {
    if (pluginEnvironment.environmentType !== EnvironmentType.desktopApp) {
      this.providerService.logService.log(new LoggedEntry("HelloWorldPlugin is not compatible with CLI", this, LogLevel.info, true));
    }
    this.providerService = pluginEnvironment.providerService;
  }

  async applySessionAction(session: Session): Promise<void> {
    this.providerService.logService.log(
      new LoggedEntry("Hello from plugin TestPlugin with session: " + session.sessionName, this, LogLevel.info, true)
    );
  }
}
