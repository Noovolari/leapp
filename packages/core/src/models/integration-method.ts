import { AccessMethodField } from "./access-method-field";
import { IntegrationType } from "./integration-type";

export class IntegrationMethod {
  constructor(public integrationType: IntegrationType, public alias: string, public integrationMethodFields: AccessMethodField[]) {}
}
