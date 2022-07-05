import { IntegrationParams } from "../integration-params";

export interface AzureIntegrationCreationParams extends IntegrationParams {
  tenantId: string;
  region?: string;
}
