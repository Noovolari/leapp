import { Integration } from "./integration";

export interface AzureIntegration extends Integration {
  id: string;
  alias: string;
  type: string;
  portalUrl: string;
  tenantId: string;
  accessTokenExpiration: string;
}
