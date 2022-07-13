import { CreateSessionRequest } from "../create-session-request";

export interface AzureSessionRequest extends CreateSessionRequest {
  region: string;
  subscriptionId: string;
  tenantId: string;
  azureIntegrationId: string;
}
