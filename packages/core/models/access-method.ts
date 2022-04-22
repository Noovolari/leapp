import { CreateSessionRequest } from "../services/session/create-session-request";
import { AccessMethodField } from "./access-method-field";
import { SessionType } from "./session-type";

export class AccessMethod {
  constructor(public sessionType: SessionType, public label: string, public accessMethodFields: AccessMethodField[], public creatable: boolean) {}

  getSessionCreationRequest(fieldValues: Map<string, string>): CreateSessionRequest {
    const requestToFill = {} as CreateSessionRequest;
    for (const field of this.accessMethodFields) {
      requestToFill[field.creationRequestField] = fieldValues.get(field.creationRequestField);
    }

    return requestToFill;
  }
}
