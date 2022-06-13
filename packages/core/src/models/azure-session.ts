import { SessionType } from "./session-type";
import { Session } from "./session";

export class AzureSession extends Session {
  subscriptionId: string;
  tenantId: string;
  azureConfigurationId: string;

  constructor(sessionName: string, region: string, subscriptionId: string, tenantId: string, azureConfigurationId: string) {
    super(sessionName, region);

    this.subscriptionId = subscriptionId;
    this.tenantId = tenantId;
    this.azureConfigurationId = azureConfigurationId;
    this.type = SessionType.azure;
  }
}
