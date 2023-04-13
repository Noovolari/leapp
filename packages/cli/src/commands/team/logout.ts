import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class TeamLogout extends LeappCommand {
  static description = "Logout from your Team account";

  static examples = [`$leapp team logout`];

  static flags = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.logout();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.cliProviderService.teamService.signOut();
      await this.cliProviderService.remoteProceduresClient.refreshWorkspaceState();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }
}
