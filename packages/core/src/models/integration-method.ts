import { AccessMethodField } from "./access-method-field";
import { IntegrationType } from "./integration-type";
import { IntegrationParams } from "./integration-params";
import { constants } from "./constants";

export class IntegrationMethod {
  constructor(public integrationType: IntegrationType, public alias: string, public integrationMethodFields: AccessMethodField[]) {}

  getIntegrationCreationParams(fieldValues: Map<string, string>): IntegrationParams {
    const integrationParams = {} as any;
    for (const field of this.integrationMethodFields) {
      integrationParams[field.creationRequestField] = fieldValues.get(field.creationRequestField);
    }
    if (this.integrationType === IntegrationType.awsSso) {
      integrationParams.browserOpening = constants.inBrowser;
    }
    return integrationParams;
  }
}
