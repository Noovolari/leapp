import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { integrationId } from "../../flags";
import { Integration } from "@noovolari/leapp-core/models/integration";

export default class SyncIntegration extends LeappCommand {
  static description = "Synchronize integration sessions";

  static examples = ["$leapp integration sync", "$leapp integration sync --integrationId ID"];

  static flags = {
    integrationId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(SyncIntegration);
      if (flags.integrationId && flags.integrationId !== "") {
        const selectedIntegration = this.cliProviderService.integrationFactory.getIntegrationById(flags.integrationId);
        if (!selectedIntegration) {
          throw new Error(`integrationId "${flags.integrationId}" is not associated to an existing integration`);
        }
        await this.sync(selectedIntegration);
      } else {
        const selectedIntegration = await this.selectIntegration();
        await this.sync(selectedIntegration);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async sync(integration: Integration): Promise<void> {
    try {
      const sessionsDiff = await this.cliProviderService.integrationFactory.syncSessions(integration.id);
      this.log(`${sessionsDiff.sessionsAdded} sessions added`);
      this.log(`${sessionsDiff.sessionsDeleted} sessions removed`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<Integration> {
    const integrations = await this.cliProviderService.integrationFactory.getIntegrations();
    if (integrations.length === 0) {
      throw new Error("no integrations available");
    }

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedIntegration",
        message: "select an integration",
        type: "list",
        choices: integrations.map((integration: any) => ({ name: integration.alias, value: integration })),
      },
    ]);
    return answer.selectedIntegration;
  }
}
