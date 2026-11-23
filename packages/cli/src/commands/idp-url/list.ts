import { Config } from "@oclif/core";
import { LeappCommand } from "../../leapp-command";
import { table, tableFlags } from "../../ux/table";

export default class ListIdpUrls extends LeappCommand {
  static description = "Show identity providers list";
  static examples = ["$leapp idp-url list"];

  static flags = {
    ...tableFlags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showIdpUrls();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showIdpUrls(): Promise<void> {
    const { flags } = await this.parse(ListIdpUrls);
    const data = this.cliProviderService.idpUrlsService.getIdpUrls().map((idpUrl: any) => ({
      id: idpUrl.id,
      url: idpUrl.url,
    })) as any as Record<string, unknown>[];

    const columns = {
      id: { header: "ID", extended: true },
      url: { header: "Identity Provider URL" },
    };

    table(data, columns, { ...flags });
  }
}
