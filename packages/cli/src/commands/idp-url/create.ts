import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";

export default class CreateIdpUrl extends LeappCommand {
  static description = "Create a new identity provider URL";

  static examples = [`$leapp idp-url create`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.promptAndCreateIdpUrl();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async promptAndCreateIdpUrl(): Promise<IdpUrl> {
    const idpUrl = await this.getIdpUrl();
    return await this.createIdpUrl(idpUrl);
  }

  async getIdpUrl(): Promise<string> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "idpUrl",
        message: `enter the identity provider URL`,
        validate: (url) => this.cliProviderService.idpUrlsService.validateIdpUrl(url),
        type: "input",
      },
    ]);
    return answer.idpUrl;
  }

  async createIdpUrl(idpUrl: string): Promise<IdpUrl> {
    const newIdpUrl = this.cliProviderService.idpUrlsService.createIdpUrl(idpUrl);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("identity provider URL created");
    return newIdpUrl;
  }
}
