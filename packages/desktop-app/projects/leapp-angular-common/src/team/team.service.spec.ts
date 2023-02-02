import { TestBed } from "@angular/core/testing";
import { TeamService } from "./team.service";
import { HttpClientService } from "../http/http-client.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { TeamProvider } from "leapp-team-core/team/team.provider";

describe("TeamService", () => {
  let teamService: TeamService;
  let teamProvider: TeamProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({})
      .overrideProvider(HttpClientService, { useValue: null })
      .overrideProvider(ConfigurationService, { useValue: { apiEndpoint: null } });
    teamService = TestBed.inject(TeamService);
    teamProvider = teamService.teamProvider;
  });

  it("should list members and invitations", async () => {
    const membersArray = [{ value: "fake-value-1" }, { value: "fake-value-2" }] as any;
    const invitationsArray = [{ value: "fake-value-3" }] as any;
    const resolveObject = {
      members: membersArray,
      invitations: invitationsArray,
    } as any;
    const listMemberSpy = spyOn(teamProvider, "listTeamMembersAndInvitations").and.resolveTo(resolveObject);
    const result = await teamService.listTeamMembersAndInvitations();
    expect(listMemberSpy).toHaveBeenCalled();
    expect(result).toEqual({
      members: membersArray,
      invitations: invitationsArray,
    });
  });
});
