import { LeappCommand } from "../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class Version extends LeappCommand {
  static description = "Displays the Cli and Core versions";

  static examples = [`$leapp version`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    const cliVersion = require("../../package.json").version;
    const coreVersion = this.cliProviderService.logService.getCoreVersion();
    this.log(`Leapp Cli\n` + `Version ${cliVersion} (Core: ${coreVersion})\n` + "© 2022 Noovolari");
  }
}
