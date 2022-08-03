import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";
import { idpUrl, idpUrlId } from "../../flags";

export default class EditIdpUrl extends LeappCommand {
  static description = "Edit an identity provider URL";

  static examples = [`$leapp idp-url edit`, `$leapp idp-url edit --idpUrlId ID --idpUrl ADDRESS`];

  static flags = {
    idpUrlId,
    idpUrl,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(EditIdpUrl);
      if (LeappCommand.areFlagsNotDefined(flags, this)) {
        const selectedIdpUrl = await this.selectIdpUrl();
        const newIdpUrl = await this.getNewIdpUrl();
        await this.editIdpUrl(selectedIdpUrl.id, newIdpUrl);
      } else {
        this.validateMyFlags(flags);
        await this.editIdpUrl(flags.idpUrlId, flags.idpUrl);
      }
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
        choices: idpUrls.map((idp) => ({ name: idp.url, value: idp })),
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

  async editIdpUrl(id: string | undefined, newIdpUrl: string | undefined): Promise<void> {
    this.cliProviderService.idpUrlsService.editIdpUrl(id || "", newIdpUrl || "");
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("IdP URL edited");
  }

  validateMyFlags(flags: any): boolean {
    if (flags.idpUrl === undefined || flags.idpUrlId === undefined) {
      throw new Error("flags --idpUrlId and --idpUrl must all be specified");
    }
    if (flags.idpUrlId === "") {
      throw new Error("IdP URL ID can't be empty");
    }
    if (!this.cliProviderService.idpUrlsService.getIdpUrl(flags.idpUrlId)) {
      throw new Error("IdP URL ID not found");
    }
    if (flags.idpUrl === "") {
      throw new Error("IdP URL can't be empty");
    }
    if (flags.idpUrl.indexOf("http://") < 0 && flags.idpUrl.indexOf("https://") < 0) {
      throw new Error("IdP URL is not valid");
    }
    return true;
  }
}
