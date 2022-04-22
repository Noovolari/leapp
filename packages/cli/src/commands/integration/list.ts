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
    const data = this.cliProviderService.awsSsoIntegrationService.getIntegrations().map((integration: any) => {
      const isOnline = this.cliProviderService.awsSsoIntegrationService.isOnline(integration);
      return {
        integrationName: integration.alias,
        portalUrl: integration.portalUrl,
        region: integration.region,
        status: isOnline ? "Online" : "Offline",
        expirationInHours: isOnline ? `Expiring ${this.cliProviderService.awsSsoIntegrationService.remainingHours(integration)}` : "-",
      };
    }) as any as Record<string, unknown>[];

    const columns = {
      integrationName: { header: "Integration Name" },
      portalUrl: { header: "Portal URL" },
      region: { header: "Region" },
      status: { header: "Status" },
      expirationInHours: { header: "Expiration" },
    };

    CliUx.ux.table(data, columns, { ...flags });
  }
}
