import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";

export default class SyncIntegration extends LeappCommand {
  static description = "Synchronize integration sessions";

  static examples = ["$leapp integration sync"];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedIntegration = await this.selectIntegration();
      await this.sync(selectedIntegration);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async sync(integration: AwsSsoIntegration): Promise<void> {
    try {
      const sessionsDiff = await this.cliProviderService.awsSsoIntegrationService.syncSessions(integration.id);
      this.log(`${sessionsDiff.sessionsToAdd.length} sessions added`);
      this.log(`${sessionsDiff.sessionsToDelete.length} sessions removed`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<AwsSsoIntegration> {
    const onlineIntegrations = this.cliProviderService.awsSsoIntegrationService.getOnlineIntegrations();
    if (onlineIntegrations.length === 0) {
      throw new Error("no online integrations available");
    }

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedIntegration",
        message: "select an integration",
        type: "list",
        choices: onlineIntegrations.map((integration: any) => ({ name: integration.alias, value: integration })),
      },
    ]);
    return answer.selectedIntegration;
  }
}
