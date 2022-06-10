import { IntegrationCreationParams } from "../integration-creation-params";

export interface AzureIntegrationCreationParams extends IntegrationCreationParams {
  tenantId: string;
}
