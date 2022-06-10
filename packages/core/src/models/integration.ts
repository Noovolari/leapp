import { IntegrationType } from "./integration-type";

export class Integration {
  constructor(public id: string, public alias: string, public type: IntegrationType) {}
}
