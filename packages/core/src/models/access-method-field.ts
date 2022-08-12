import { FieldChoice } from "../services/field-choice";
import { AccessMethodFieldType } from "./access-method-field-type";

export class AccessMethodField {
  constructor(
    public creationRequestField: string,
    public message: string,
    public type: AccessMethodFieldType,
    public choices?: FieldChoice[],
    public fieldValidator?: (alias: string) => boolean | string
  ) {}
}
