import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import { integrationId } from "../../flags";

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
        const selectedIntegration = this.cliProviderService.awsSsoIntegrationService.getIntegration(flags.integrationId);
        if (!selectedIntegration) {
          throw new Error("integrationId is not associated to an existing integration");
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

  async login(integration: AwsSsoIntegration): Promise<void> {
    this.log("waiting for browser authorization using your AWS sign-in...");
    try {
      const sessionsDiff = await this.cliProviderService.awsSsoIntegrationService.syncSessions(integration.id);
      this.log(`${sessionsDiff.sessionsToAdd.length} sessions added`);
      this.log(`${sessionsDiff.sessionsToDelete.length} sessions removed`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<AwsSsoIntegration> {
    const offlineIntegrations = this.cliProviderService.awsSsoIntegrationService.getOfflineIntegrations();
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
