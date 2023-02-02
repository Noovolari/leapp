import { TestBed } from "@angular/core/testing";
import { HttpClientMock } from "leapp-team-core/test/http-client-mock";
import { InvitationProvider } from "leapp-team-core/invitation/invitation.provider";
import { InvitationService } from "./invitation.service";
import { HttpClientService } from "../http/http-client.service";
import { Role } from "leapp-team-core/user/role";

describe("InvitationService", () => {
  let service: InvitationService;
  let httpClientMock: HttpClientMock;
  let invitationProviderMock: InvitationProvider;

  beforeEach(async () => {
    httpClientMock = new HttpClientMock();
    invitationProviderMock = new InvitationProvider("", httpClientMock);

    TestBed.configureTestingModule({}).overrideProvider(HttpClientService, { useValue: httpClientMock });
    service = TestBed.inject(InvitationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("Create - Should create an invitation", async () => {
    spyOn(invitationProviderMock, "create").and.callThrough();
    (service as any).invitationProvider = invitationProviderMock;

    await service.create("fake-email", Role.manager, "12");

    expect(invitationProviderMock.create).toHaveBeenCalledWith("fake-email", Role.manager, "12");
  });
});
