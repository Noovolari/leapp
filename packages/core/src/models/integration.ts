import { IntegrationType } from "./integration-type";

export interface Integration {
  id: string;
  alias: string;
  type: IntegrationType;
}
