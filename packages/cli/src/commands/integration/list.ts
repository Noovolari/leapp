import { ux } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { LeappCommand } from "../../leapp-command";

export default class ListIntegrations extends LeappCommand {
  static description = "Show integrations list";
  static examples = ["$leapp integration list"];

  static flags = {
    ...ux.table.flags(),
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
    const integrations = this.cliProviderService.integrationFactory.getIntegrations();

    for (const integration of integrations) {
      const isOnline = integration.isOnline;
      data.push({
        integrationId: integration.id,
        integrationType: integration.type,
        integrationName: integration.alias,
        urlOrTenant: (integration as any).portalUrl ?? (integration as any).tenantId,
        region: (integration as any).region ?? (integration as any).location,
        status: isOnline ? "Online" : "Offline",
        expirationInHours: isOnline ? `Expiring ${this.cliProviderService.integrationFactory.getRemainingHours(integration)}` : "-",
      } as Record<string, unknown>);
    }

    const columns = {
      integrationId: { header: "ID", extended: true },
      integrationType: { header: "Type" },
      integrationName: { header: "Integration Name" },
      urlOrTenant: { header: "AWS Portal URL/Azure Tenant ID" },
      region: { header: "Region/Location" },
      status: { header: "Status" },
      expirationInHours: { header: "Expiration" },
    };

    ux.table(data, columns, { ...flags });
  }
}
