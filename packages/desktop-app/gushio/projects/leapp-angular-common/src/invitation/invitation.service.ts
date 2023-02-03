import { Injectable } from "@angular/core";
import { InvitationProvider } from "leapp-team-core/invitation/invitation.provider";
import { HttpClientService } from "../http/http-client.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { Role } from "leapp-team-core/user/role";

@Injectable({
  providedIn: "root",
})
export class InvitationService {
  private invitationProvider: InvitationProvider;

  constructor(httpClientService: HttpClientService, configService: ConfigurationService) {
    this.invitationProvider = new InvitationProvider(configService.apiEndpoint, httpClientService);
  }

  async create(email: string, invitedUserRole: Role, inviterId: string): Promise<any> {
    return await this.invitationProvider.create(email, invitedUserRole, inviterId);
  }
}
