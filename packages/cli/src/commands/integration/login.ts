import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { integrationId } from "../../flags";
import { Integration } from "@noovolari/leapp-core/models/integration";

export default class LoginIntegration extends LeappCommand {
  static description = "Login to synchronize integration sessions";

  static examples = ["$leapp integration login", "$leapp integration login --integrationId ID"];

  static flags = {
    integrationId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(LoginIntegration);
      if (flags.integrationId && flags.integrationId !== "") {
        const selectedIntegration = this.cliProviderService.integrationFactory.getIntegrationById(flags.integrationId);
        if (!selectedIntegration) {
          throw new Error(`integrationId "${flags.integrationId}" is not associated to an existing integration`);
        }
        await this.login(selectedIntegration);
      } else {
        const selectedIntegration = await this.selectIntegration();
        await this.login(selectedIntegration);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async login(integration: Integration): Promise<void> {
    this.log("waiting for browser authorization...");
    try {
      const sessionsDiff = await this.cliProviderService.integrationFactory.syncSessions(integration.id);
      this.log(`${sessionsDiff.sessionsAdded} sessions added`);
      this.log(`${sessionsDiff.sessionsDeleted} sessions removed`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<Integration> {
    const offlineIntegrations = this.cliProviderService.integrationFactory
      .getIntegrations()
      .filter((integration: Integration) => !integration.isOnline);
    if (offlineIntegrations.length === 0) {
      throw new Error("no offline integrations available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedIntegration",
        message: "select an integration",
        type: "list",
        choices: offlineIntegrations.map((integration: any) => ({ name: integration.alias, value: integration })),
      },
    ]);
    return answer.selectedIntegration;
  }
}
