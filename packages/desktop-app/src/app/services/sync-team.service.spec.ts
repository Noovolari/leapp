import { TestBed } from "@angular/core/testing";

import { SyncTeamService } from "./sync-team.service";

describe("SyncTeamService", () => {
  let service: SyncTeamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncTeamService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
