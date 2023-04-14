import { LeappCommand } from "../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { constants } from "@noovolari/leapp-core/models/constants";

export default class Workspace extends LeappCommand {
  static description = "Show the current workspace";

  static examples = [`$leapp workspace`];

  static flags = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const workspaceName = this.cliProviderService.teamService.workspaceNameState.getValue();
      if (workspaceName === constants.localWorkspaceName) {
        this.log("local");
      } else {
        this.log(workspaceName);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }
}
