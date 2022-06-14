import { IntegrationParams } from "../integration-params";

export interface AwsSsoIntegrationCreationParams extends IntegrationParams {
  portalUrl: string;
  region: string;
  browserOpening: string;
}
