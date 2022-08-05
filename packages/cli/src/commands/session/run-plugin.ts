import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { sessionId, pluginName } from "../../flags";
import { IPlugin } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
import { Session } from "@noovolari/leapp-core/models/session";
import { OperatingSystem, osMap } from "@noovolari/leapp-core/models/operating-system";

export default class RunPlugin extends LeappCommand {
  static description = "Run a Leapp Plugin";

  static examples = [`$leapp session run-plugin`, `$leapp session run-plugin --sessionName SESSIONAME --pluginName PLUGINNAME`];

  static flags = {
    sessionId,
    pluginName,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(RunPlugin);
      if (flags.sessionId && flags.sessionId !== "" && flags.pluginName && flags.pluginName !== "") {
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId);
        if (!selectedSession) {
          throw new Error("No session found with id " + flags.sessionId);
        }
        const selectedPlugin = this.cliProviderService.pluginManagerService.getPluginByName(flags.pluginName);
        if (!selectedPlugin) {
          throw new Error("No plugin found with name " + flags.pluginName);
        }
        await this.runPlugin(selectedSession, selectedPlugin);
      } else {
        const selectedSession = await this.selectSession();
        const os = osMap[this.cliProviderService.cliNativeService.os.platform()];
        const selectedPlugin = await this.selectPlugin(os, selectedSession);
        await this.runPlugin(selectedSession, selectedPlugin);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async runPlugin(session: Session, plugin: IPlugin): Promise<void> {
    await plugin.bootstrap(this.cliProviderService.pluginManagerService.pluginEnvironment);
    await plugin.applySessionAction(session);
    this.log("run plugin for this session");
  }

  private async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService.getSessions();
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session: any) => ({ name: session.sessionName, value: session })),
      },
    ]);
    return answer.selectedSession;
  }

  private async selectPlugin(os: OperatingSystem, selectedSession: Session): Promise<IPlugin> {
    await this.cliProviderService.pluginManagerService.loadFromPluginDir();
    const availablePlugins = this.cliProviderService.pluginManagerService.availablePlugins(os, selectedSession);
    if (availablePlugins.length === 0) {
      throw new Error("no plugins available for selected session on this operating system");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedPlugin",
        message: "select a plugin",
        type: "list",
        choices: availablePlugins.map((plugin: any) => ({ name: plugin.metadata.uniqueName, value: plugin })),
      },
    ]);
    return answer.selectedPlugin;
  }
}
