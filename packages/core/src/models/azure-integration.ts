import { Integration } from "./integration";

export interface AzureIntegration extends Integration {
  tenantId: string;
}
