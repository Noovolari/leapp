import { Integration } from "../integration";
import { IntegrationType } from "../integration-type";

export class AzureIntegration extends Integration {
  constructor(id: string, alias: string, public tenantId: string, public region: string) {
    super(id, alias, IntegrationType.azure, false);
  }
}
