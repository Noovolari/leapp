import { TestBed } from "@angular/core/testing";

import { SelectedSessionActionsService } from "./selected-session-actions.service";

describe("SelectedSessionActionsService", () => {
  let service: SelectedSessionActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedSessionActionsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
