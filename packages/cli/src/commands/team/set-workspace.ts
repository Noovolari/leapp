import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class SetWorkspace extends LeappCommand {
  static description = "Set the current Leapp workspace";

  static examples = ["$leapp team set-workspace", "$leapp team set-workspace local", "$leapp team set-workspace WORKSPACE-NAME"];

  static flags = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { argv } = await this.parse(SetWorkspace);
      if (argv.length > 0) {
        const workspaceId = await this.getWorkspaceIdByName(argv[0]);
        await this.setWorkspace(workspaceId);
      } else {
        const workspaceId = await this.getWorkspaceIdInteractively();
        await this.setWorkspace(workspaceId);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  private async getWorkspaceIdByName(_string: string): Promise<string> {
    throw new Error();
  }

  private async getWorkspaceIdInteractively(): Promise<string> {
    throw new Error();
  }

  private async setWorkspace(_string: string) {
    throw new Error();
  }
}
