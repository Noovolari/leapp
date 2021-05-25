import {SessionType} from './session-type';
import {Session} from './session';

export class AzureSession extends Session {

  subscriptionId: string;
  tenantId: string;

  constructor(sessionName: string, region: string, subscriptionId: string, tenantId: string) {
    super(sessionName, region);
    this.type = SessionType.azure;

    this.subscriptionId = subscriptionId;
    this.tenantId = tenantId;
  }
}
