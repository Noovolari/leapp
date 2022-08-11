import { SessionType } from "../session-type";
import { Session } from "../session";

export class AzureSession extends Session {
  subscriptionId: string;
  tenantId: string;
  azureIntegrationId: string;

  constructor(sessionName: string, region: string, subscriptionId: string, tenantId: string, azureIntegrationId: string) {
    super(sessionName, region);

    this.subscriptionId = subscriptionId;
    this.tenantId = tenantId;
    this.azureIntegrationId = azureIntegrationId;
    this.type = SessionType.azure;
  }
}
