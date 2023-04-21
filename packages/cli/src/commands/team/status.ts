import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class TeamStatus extends LeappCommand {
  static description = "Get the team login status";

  static examples = [`$leapp team status`];

  static flags = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const teamStatus = await this.cliProviderService.teamService.getTeamStatus();
      this.log(teamStatus);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }
}
