import { Integration } from "../integration";
import { IntegrationType } from "../integration-type";

export interface AzureIntegration extends Integration {
  id: string;
  alias: string;
  tenantId: string;
  type: IntegrationType;
}
