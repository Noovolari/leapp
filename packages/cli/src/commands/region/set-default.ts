import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

export default class ChangeDefaultRegion extends LeappCommand {
  static description = "Change the default region";

  static examples = [`$leapp region set-default`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    const selectedDefaultRegion = await this.selectDefaultRegion();
    try {
      await this.changeDefaultRegion(selectedDefaultRegion);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectDefaultRegion(): Promise<string> {
    const defaultRegion = this.cliProviderService.regionsService.getDefaultAwsRegion();
    const availableRegions = this.cliProviderService.cloudProviderService.availableRegions(SessionType.aws);

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedDefaultRegion",
        message: `current default region is ${defaultRegion}, select a new default region`,
        type: "list",
        choices: availableRegions.map((region) => ({ name: region.fieldName, value: region.fieldValue })),
      },
    ]);
    return answer.selectedDefaultRegion;
  }

  async changeDefaultRegion(newDefaultRegion: string): Promise<void> {
    this.cliProviderService.regionsService.changeDefaultAwsRegion(newDefaultRegion);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("default region changed");
  }
}
