import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";
import { idpUrl } from "../../flags";

export default class CreateIdpUrl extends LeappCommand {
  static description = "Create a new identity provider URL";

  static examples = [`$leapp idp-url create`, `$leapp idp-url create --idpUrl ADDRESS`];

  static flags = {
    idpUrl,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(CreateIdpUrl);
      if (flags.idpUrl !== undefined) {
        const validate = this.cliProviderService.idpUrlsService.validateIdpUrl(flags.idpUrl);
        if (validate === true) {
          await this.createIdpUrl(flags.idpUrl);
        } else {
          throw new Error(validate.toString());
        }
      } else {
        await this.promptAndCreateIdpUrl();
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async promptAndCreateIdpUrl(): Promise<IdpUrl> {
    const idpUrlString = await this.getIdpUrl();
    return await this.createIdpUrl(idpUrlString);
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

  async createIdpUrl(idpUrlString: string): Promise<IdpUrl> {
    const newIdpUrl = this.cliProviderService.idpUrlsService.createIdpUrl(idpUrlString);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("identity provider URL created");
    return newIdpUrl;
  }
}
