import { IntegrationType } from "./integration-type";

export abstract class Integration {
  constructor(public id: string, public alias: string, public type: IntegrationType, public isOnline: boolean) {}
}
