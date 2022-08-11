import { Integration } from "../integration";
import { IntegrationType } from "../integration-type";

export class AzureIntegration extends Integration {
  private _tokenExpiration: string;

  constructor(id: string, alias: string, public tenantId: string, public region: string) {
    super(id, alias, IntegrationType.azure, false);
  }

  set tokenExpiration(tokenExpiration: string) {
    this._tokenExpiration = tokenExpiration;
  }

  get tokenExpiration(): string {
    return this._tokenExpiration;
  }
}
