import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { IdpUrl } from "@noovolari/leapp-core/models/idp-url";

export default class DeleteIdpUrl extends LeappCommand {
  static description = "Delete an identity provider URL";

  static examples = [`$leapp idp-url delete`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedIdpUrl = await this.selectIdpUrl();
      const affectedSessions = this.getAffectedSessions(selectedIdpUrl.id);
      if (await this.askForConfirmation(affectedSessions)) {
        await this.deleteIdpUrl(selectedIdpUrl.id);
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
        name: "selectedIdUrl",
        message: "select an identity provider URL to delete",
        type: "list",
        choices: idpUrls.map((idpUrl) => ({ name: idpUrl.url, value: idpUrl })),
      },
    ]);
    return answer.selectedIdUrl;
  }

  getAffectedSessions(idpUrlId: string): Session[] {
    return this.cliProviderService.idpUrlsService.getDependantSessions(idpUrlId);
  }

  async askForConfirmation(affectedSessions: Session[]): Promise<boolean> {
    if (affectedSessions.length === 0) {
      return true;
    }
    const sessionsList = affectedSessions.map((session) => `- ${session.sessionName}`).join("\n");
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "confirmation",
        message: `deleting this identity provider URL will delete also these sessions\n${sessionsList}\nDo you want to continue?`,
        type: "confirm",
      },
    ]);
    return answer.confirmation;
  }

  async deleteIdpUrl(id: string): Promise<void> {
    await this.cliProviderService.idpUrlsService.deleteIdpUrl(id);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("identity provider URL deleted");
  }
}
