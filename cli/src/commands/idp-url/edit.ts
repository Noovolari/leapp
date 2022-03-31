import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";

export default class EditIdpUrl extends LeappCommand {
  static description = "Edit an identity provider URL";

  static examples = [`$leapp idp-url edit`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedIdpUrl = await this.selectIdpUrl();
      const newIdpUrl = await this.getNewIdpUrl();
      await this.editIdpUrl(selectedIdpUrl.id, newIdpUrl);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectIdpUrl(): Promise<IdpUrl> {
    const idpUrls = this.cliProviderService.idpUrlsService.getIdpUrls();
    if (idpUrls.length === 0) {
      throw new Error("no identity provider URLs available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedIdpUrl",
        message: "select an identity provider URL",
        type: "list",
        choices: idpUrls.map((idpUrl) => ({ name: idpUrl.url, value: idpUrl })),
      },
    ]);
    return answer.selectedIdpUrl;
  }

  async getNewIdpUrl(): Promise<string> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "newIdpUrl",
        message: "choose a new URL",
        validate: (url) => this.cliProviderService.idpUrlsService.validateIdpUrl(url),
        type: "input",
      },
    ]);
    return answer.newIdpUrl;
  }

  async editIdpUrl(id: string, newIdpUrl: string): Promise<void> {
    await this.cliProviderService.idpUrlsService.editIdpUrl(id, newIdpUrl);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("IdP URL edited");
  }
}
