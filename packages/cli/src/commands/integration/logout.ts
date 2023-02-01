import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { integrationId } from "../../flags";
import { Integration } from "@noovolari/leapp-core/models/integration";

export default class LogoutIntegration extends LeappCommand {
  static description = "Logout from an integration";

  static examples = ["$leapp integration logout", "$leapp integration logout --integrationId ID"];

  static flags = {
    integrationId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(LogoutIntegration);
      if (flags.integrationId && flags.integrationId !== "") {
        const selectedIntegration = this.cliProviderService.integrationFactory.getIntegrationById(flags.integrationId);
        if (!selectedIntegration) {
          throw new Error(`integrationId "${flags.integrationId}" is not associated to an existing integration`);
        }
        if (!selectedIntegration.isOnline) {
          throw new Error("integration is already offline");
        }
        await this.logout(selectedIntegration);
      } else {
        const selectedIntegration = await this.selectIntegration();
        await this.logout(selectedIntegration);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async logout(integration: Integration): Promise<void> {
    try {
      await this.cliProviderService.integrationFactory.logout(integration.id);
      this.log("logout successful");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<Integration> {
    const onlineIntegrations = await this.cliProviderService.integrationFactory
      .getIntegrations()
      .filter((integration: Integration) => integration.isOnline);
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
