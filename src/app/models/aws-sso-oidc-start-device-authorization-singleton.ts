import {
  RegisterClientResponse,
  StartDeviceAuthorizationResponse
} from '../services/session/aws/methods/aws-sso-role.service';
import SSOOIDC, {RegisterClientRequest, StartDeviceAuthorizationRequest} from 'aws-sdk/clients/ssooidc';

export class AwsSsoOidcStartDeviceAuthorizationSingleton {
  private static instance: AwsSsoOidcStartDeviceAuthorizationSingleton;
  private ssoOidc: SSOOIDC;
  private currentRegion: string;
  private currentPortalUrl: string;
  private registerClientResponse: RegisterClientResponse;
  private startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse;
  private startDeviceAuthorizationResponseExpiresAt: number;

  private constructor() {}

  static getInstance() {
    if(!this.instance) {
      this.instance = new AwsSsoOidcStartDeviceAuthorizationSingleton();
    }
    return this.instance;
  }

  getAwsSsoOidcClient(): SSOOIDC {
    return this.ssoOidc;
  }

  async getStartDeviceAuthorizationResponse(region: string, portalUrl: string): Promise<StartDeviceAuthorizationResponse> {
    if (!this.ssoOidc || (region !== this.currentRegion) || (portalUrl !== this.currentPortalUrl)) {
      console.log('condition 1');

      this.currentRegion = region;
      this.currentPortalUrl = portalUrl;

      this.ssoOidc = new SSOOIDC({ region });

      await this.registerSsoOidcClient();

      const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
        clientId: this.registerClientResponse.clientId,
        clientSecret: this.registerClientResponse.clientSecret,
        startUrl: portalUrl
      };

      const baseTimeInMilliseconds = Date.now();
      this.startDeviceAuthorizationResponse = await this.getAwsSsoOidcClient().startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
      this.startDeviceAuthorizationResponseExpiresAt = baseTimeInMilliseconds + this.startDeviceAuthorizationResponse.expiresIn * 1000;
    }

    console.log('clientSecretExpiresAt', this.registerClientResponse.clientSecretExpiresAt, Date.now());

    if (this.registerClientResponse.clientSecretExpiresAt * 1000 < Date.now()) {
      console.log('condition 2');

      await this.registerSsoOidcClient();

      const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
        clientId: this.registerClientResponse.clientId,
        clientSecret: this.registerClientResponse.clientSecret,
        startUrl: portalUrl
      };

      this.startDeviceAuthorizationResponse = await this.getAwsSsoOidcClient().startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
    }

    console.log('expiresIn', this.startDeviceAuthorizationResponse.expiresIn, Date.now());

    if (this.startDeviceAuthorizationResponseExpiresAt < Date.now()) {
      console.log('condition 3');

      const startDeviceAuthorizationRequest: StartDeviceAuthorizationRequest = {
        clientId: this.registerClientResponse.clientId,
        clientSecret: this.registerClientResponse.clientSecret,
        startUrl: portalUrl
      };

      this.startDeviceAuthorizationResponse = await this.getAwsSsoOidcClient().startDeviceAuthorization(startDeviceAuthorizationRequest).promise();
    }

    return this.startDeviceAuthorizationResponse;
  }

  getRegisterClientResponse(): RegisterClientResponse {
    return this.registerClientResponse;
  }

  private async registerSsoOidcClient(): Promise<void> {
    const registerClientRequest: RegisterClientRequest = { clientName: 'leapp', clientType: 'public' };
    this.registerClientResponse = await this.ssoOidc.registerClient(registerClientRequest).promise();
  }
}
