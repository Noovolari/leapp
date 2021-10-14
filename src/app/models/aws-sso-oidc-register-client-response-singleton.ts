import {RegisterClientResponse} from '../services/session/aws/methods/aws-sso-role.service';
import SSOOIDC, {RegisterClientRequest} from 'aws-sdk/clients/ssooidc';

export class AwsSsoOidcRegisterClientResponseSingleton {
  private instance: AwsSsoOidcRegisterClientResponseSingleton;
  private registerClientResponse: RegisterClientResponse;
  private ssoOidc: SSOOIDC;
  private region: string;

  private constructor() {}

  static getInstance() {
    if(!this.instance) {
      this.instance = new AwsSsoOidcRegisterClientResponseSingleton();
    }
    return this.instance;
  }

  getRegisterClientResponse(region: string): RegisterClientResponse {
    if (!this.ssoOidc || (region !== this.region)) {
      this.ssoOidc = new SSOOIDC({ region });
      this.region = region;
    }

    if (this.registerClientResponse.clientSecretExpiresAt < Date.now()) {
      this.registerSsoOidcClient();
    }
    return this.registerClientResponse;
  }




  initialize(region: string): void {
    if (!this.ssoOidc && !this.registerClientResponse) {
      this.invalidateSsoOidcClient(region);
    }
  }

  invalidateSsoOidcClient(region: string): void {
    this.ssoOidc = new SSOOIDC({ region });
    this.registerSsoOidcClient();
  }



  private registerSsoOidcClient(): void {
    const registerClientRequest: RegisterClientRequest = { clientName: 'leapp', clientType: 'public' };
    this.registerClientResponse = this.ssoOidc.registerClient(registerClientRequest).promise();
  }
}
