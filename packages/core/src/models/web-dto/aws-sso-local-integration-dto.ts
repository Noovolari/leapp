import { BrowserOpeningType } from "./browser-opening-type";
import { LocalSecretDto } from "./local-secret-dto";
import { SecretType } from "./secret-type";

export class AwsSsoLocalIntegrationDto extends LocalSecretDto {
  constructor(public id: string, public alias: string, public portalUrl: string, public region: string, public browserOpening: BrowserOpeningType) {
    super(SecretType.awsSsoIntegration);
  }
}
