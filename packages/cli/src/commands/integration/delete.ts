import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { integrationId } from "../../flags";
import { Integration } from "@noovolari/leapp-core/models/integration";

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
        const selectedIntegration = this.cliProviderService.integrationFactory.getIntegrationById(flags.integrationId);
        if (!selectedIntegration) {
          throw new Error(`integrationId "${flags.integrationId}" is not associated to an existing integration`);
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

  async delete(integration: Integration): Promise<void> {
    try {
      await this.cliProviderService.integrationFactory.delete(integration.id);
      this.log(`integration deleted`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshIntegrations();
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectIntegration(): Promise<Integration> {
    const integrations = this.cliProviderService.integrationFactory.getIntegrations();
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
