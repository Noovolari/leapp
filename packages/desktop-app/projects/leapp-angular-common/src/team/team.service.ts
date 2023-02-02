import { Injectable } from "@angular/core";
import { HttpClientService } from "../http/http-client.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { TeamProvider } from "leapp-team-core/team/team.provider";
import { GetTeamMembersResponseDto } from "leapp-team-core/team/dto/get-team-members-response-dto";

@Injectable({
  providedIn: "root",
})
export class TeamService {
  public teamProvider: TeamProvider;

  constructor(httpClientService: HttpClientService, configService: ConfigurationService) {
    this.teamProvider = new TeamProvider(configService.apiEndpoint, httpClientService);
  }

  async listTeamMembersAndInvitations(): Promise<GetTeamMembersResponseDto> {
    return await this.teamProvider.listTeamMembersAndInvitations();
  }
}
