import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class GetDefaultRegion extends LeappCommand {
  static description = "Displays the default region";

  static examples = [`$leapp region get-default`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    const defaultAwsRegion = this.cliProviderService.regionsService.getDefaultAwsRegion();
    this.log(defaultAwsRegion);
  }
}
