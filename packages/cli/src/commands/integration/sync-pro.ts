import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";

export default class SyncProIntegration extends LeappCommand {
  static description = "Synchronize Leapp-PRO integration sessions";

  static examples = ["$leapp integration pro sync"];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const email = await this.getEmail();
      const password = await this.getPassword();
      const secretDtos = await this.cliProviderService.webSyncService.syncSecrets(email, password);
      this.log(`${secretDtos.length} elements synchronized.`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async getEmail(): Promise<string> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "email",
        message: `enter your leapp PRO account email`,
        type: "input",
      },
    ]);
    return answer.email;
  }

  async getPassword(): Promise<string> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "password",
        message: `enter your leapp PRO account password`,
        type: "password",
      },
    ]);
    return answer.password;
  }
}
