import { CliUx } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { LeappCommand } from "../../leapp-command";

export default class ListProfiles extends LeappCommand {
  static description = "Show profile list";
  static examples = ["$leapp profile list"];

  static flags = {
    ...CliUx.ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showProfiles();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showProfiles(): Promise<void> {
    const { flags } = await this.parse(ListProfiles);
    const data = this.cliProviderService.namedProfilesService.getNamedProfiles().map((profile: any) => ({
      id: profile.id,
      name: profile.name,
    })) as any as Record<string, unknown>[];

    const columns = {
      id: { header: "ID", extended: true },
      name: { header: "Profile Name" },
    };

    CliUx.ux.table(data, columns, { ...flags });
  }
}
