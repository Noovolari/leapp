import { IntegrationCreationParams } from "../integration-creation-params";

export interface AwsSsoIntegrationCreationParams extends IntegrationCreationParams {
  portalUrl: string;
  region: string;
  browserOpening: string;
}
