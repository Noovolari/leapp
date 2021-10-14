import {RegisterClientResponse} from '../services/session/aws/methods/aws-sso-role.service';
import SSOOIDC, {RegisterClientRequest} from 'aws-sdk/clients/ssooidc';

export class AwsSsoOidcRegisterClientResponseSingleton {
  private static instance: AwsSsoOidcRegisterClientResponseSingleton;
  private registerClientResponse: RegisterClientResponse;
  private ssoOidc: SSOOIDC;
  private currentRegion: string;

  private constructor() {}

  static getInstance() {
    if(!this.instance) {
      this.instance = new AwsSsoOidcRegisterClientResponseSingleton();
    }
    return this.instance;
  }

  async getRegisterClientResponse(region: string): Promise<RegisterClientResponse> {
    if (!this.ssoOidc || (region !== this.currentRegion)) {
      this.ssoOidc = new SSOOIDC({ region });
      this.currentRegion = region;
      await this.registerSsoOidcClient();
    }

    if (this.registerClientResponse.clientSecretExpiresAt < Date.now()) {
      await this.registerSsoOidcClient();
    }

    return this.registerClientResponse;
  }

  getAwsSsoOidcClient(): SSOOIDC {
    return this.ssoOidc;
  }

  private async registerSsoOidcClient(): Promise<void> {
    const registerClientRequest: RegisterClientRequest = { clientName: 'leapp', clientType: 'public' };
    this.registerClientResponse = await this.ssoOidc.registerClient(registerClientRequest).promise();
  }
}
