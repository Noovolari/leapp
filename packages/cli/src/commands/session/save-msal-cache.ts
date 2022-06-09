import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class SaveMsalCache extends LeappCommand {
  static description = "Save msal cache";

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    const jsonCache = await this.cliProviderService.msalPersistenceService.load();
    const strJsonCache = JSON.stringify(jsonCache, null, 4);
    this.cliProviderService.cliNativeService.fs.writeFileSync("./test.json", strJsonCache, { encoding: "utf8" });
  }
}
