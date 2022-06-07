import { Integration } from "../integration";

export interface AwsSsoIntegration extends Integration {
  portalUrl: string;
  region: string;
  accessTokenExpiration: string;
  browserOpening: string;
}
