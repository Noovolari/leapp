import { IAwsSamlAuthenticationService } from "@hesketh-racing/leapp-core/interfaces/i-aws-saml-authentication-service";
import { RemoteProceduresClient } from "@hesketh-racing/leapp-core/services/remote-procedures-client";

export class CliRpcAwsSamlAuthenticationService implements IAwsSamlAuthenticationService {
  constructor(private remoteProceduresClient: RemoteProceduresClient) {}

  async needAuthentication(idpUrl: string): Promise<boolean> {
    return this.remoteProceduresClient.needAuthentication(idpUrl);
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<string> {
    return this.remoteProceduresClient.awsSignIn(idpUrl, needToAuthenticate);
  }

  async closeAuthenticationWindow(): Promise<void> {
    // TODO: not yet implemented in desktop app
  }
}
