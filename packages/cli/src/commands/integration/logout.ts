import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";
import { integrationId } from "../../flags";

export default class LogoutIntegration extends LeappCommand {
  static description = "Logout from integration";

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
        const selectedIntegration = this.cliProviderService.awsSsoIntegrationService.getIntegration(flags.integrationId);
        await this.logout(selectedIntegration);
      } else {
        const selectedIntegration = await this.selectIntegration();
        await this.logout(selectedIntegration);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async logout(integration: AwsSsoIntegration): Promise<void> {
    try {
      await this.cliProviderService.awsSsoIntegrationService.logout(integration.id);
      this.log("logout successful");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
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
