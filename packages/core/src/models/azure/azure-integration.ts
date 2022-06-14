import { Integration } from "../integration";
import { IntegrationType } from "../integration-type";

export class AzureIntegration extends Integration {
  constructor(id: string, alias: string, public tenantId: string) {
    super(id, alias, IntegrationType.awsSso, false);
  }

  /*get isOnline(): Promise<boolean> {
    return Promise.resolve(true);
  }*/
}
