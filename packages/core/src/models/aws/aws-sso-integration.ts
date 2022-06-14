import { Integration } from "../integration";
import { IntegrationType } from "../integration-type";

export interface AwsSsoIntegration extends Integration {
  id: string;
  alias: string;
  portalUrl: string;
  region: string;
  browserOpening: string;
  accessTokenExpiration: string;
  type: IntegrationType;
}
