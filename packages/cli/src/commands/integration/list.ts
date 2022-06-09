import { CliUx } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { LeappCommand } from "../../leapp-command";

export default class ListIntegrations extends LeappCommand {
  static description = "Show integrations list";
  static examples = ["$leapp integration list"];

  static flags = {
    ...CliUx.ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showIntegrations();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showIntegrations(): Promise<void> {
    const { flags } = await this.parse(ListIntegrations);
    const data: Record<string, unknown>[] = [];
    const integrations = this.cliProviderService.awsSsoIntegrationService.getIntegrations();

    for (const integration of integrations) {
      const isOnline = await this.cliProviderService.awsSsoIntegrationService.isOnline(integration);
      data.push({
        integrationId: integration.id,
        integrationName: integration.alias,
        portalUrl: integration.portalUrl,
        region: integration.region,
        status: isOnline ? "Online" : "Offline",
        expirationInHours: isOnline ? `Expiring ${this.cliProviderService.awsSsoIntegrationService.remainingHours(integration)}` : "-",
      } as Record<string, unknown>);
    }

    const columns = {
      integrationId: { header: "ID", extended: true },
      integrationName: { header: "Integration Name" },
      portalUrl: { header: "Portal URL" },
      region: { header: "Region" },
      status: { header: "Status" },
      expirationInHours: { header: "Expiration" },
    };

    CliUx.ux.table(data, columns, { ...flags });
  }
}
