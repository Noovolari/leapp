import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import { integrationId } from "../../flags";

export default class DeleteIntegration extends LeappCommand {
  static description = "Delete an integration";

  static examples = ["$leapp integration delete", "$leapp integration delete --integrationId ID"];

  static flags = {
    integrationId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(DeleteIntegration);
      if (flags.integrationId && flags.integrationId !== "") {
        const selectedIntegration = this.cliProviderService.awsSsoIntegrationService.getIntegration(flags.integrationId);
        if (!selectedIntegration) {
          throw new Error("integrationId is not associated to an existing integration");
        }
        await this.delete(selectedIntegration);
      } else {
        const selectedIntegration = await this.selectIntegration();
        await this.delete(selectedIntegration);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async delete(integration: AwsSsoIntegration): Promise<void> {
    try {
      await this.cliProviderService.awsSsoIntegrationService.deleteIntegration(integration.id);
      this.log(`integration deleted`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<AwsSsoIntegration> {
    const integrations = this.cliProviderService.awsSsoIntegrationService.getIntegrations();
    if (integrations.length === 0) {
      throw new Error("no integrations available");
    }

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedIntegration",
        message: "select an integration to delete",
        type: "list",
        choices: integrations.map((integration: any) => ({ name: integration.alias, value: integration })),
      },
    ]);
    return answer.selectedIntegration;
  }
}
