import { Config } from "@oclif/core/lib/config/config";
import { sessionId, pluginName } from "../../flags";
import { Session } from "@noovolari/leapp-core/models/session";
import { OperatingSystem, osMap } from "@noovolari/leapp-core/models/operating-system";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { LeappCommand } from "../../leapp-command";

export default class RunAwsCredentialPlugin extends LeappCommand {
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
      const { flags } = await this.parse(RunAwsCredentialPlugin);
      const os = osMap[this.cliProviderService.cliNativeService.os.platform()];
      if (flags.sessionId && flags.sessionId !== "" && flags.pluginName && flags.pluginName !== "") {
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId);
        if (!selectedSession) {
          throw new Error("No session found with id " + flags.sessionId);
        }
        const selectedPlugin = this.cliProviderService.pluginManagerService
          .availableAwsCredentialsPlugins(os, selectedSession)
          .find((plugin) => plugin.metadata.uniqueName === flags.pluginName);

        if (selectedPlugin === undefined) {
          throw new Error("No AWS session plugin available with name " + flags.pluginName);
        }
        await this.runPlugin(selectedSession, selectedPlugin as any);
      } else {
        const selectedSession = await this.selectSession();
        const selectedPlugin = await this.selectPlugin(os, selectedSession);
        await this.runPlugin(selectedSession, selectedPlugin);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async runPlugin(session: Session, plugin: AwsCredentialsPlugin): Promise<void> {
    await plugin.run(session);
  }

  private async selectSession(): Promise<Session> {
    const awsSessionTypes = this.cliProviderService.sessionFactory.getCompatibleTypes(SessionType.aws);
    const availableSessions = this.cliProviderService.sessionManagementService
      .getSessions()
      .filter((session) => awsSessionTypes.includes(session.type));
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

  private async selectPlugin(os: OperatingSystem, selectedSession: Session): Promise<AwsCredentialsPlugin> {
    await this.cliProviderService.pluginManagerService.loadFromPluginDir();
    const availablePlugins = this.cliProviderService.pluginManagerService.availableAwsCredentialsPlugins(os, selectedSession);
    if (availablePlugins.length === 0) {
      throw new Error("no AWS credential plugins available for selected session on this operating system");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedPlugin",
        message: "select a plugin",
        type: "list",
        choices: availablePlugins.map((plugin: any) => ({ name: plugin.actionName, value: plugin })),
      },
    ]);
    return answer.selectedPlugin;
  }
}
