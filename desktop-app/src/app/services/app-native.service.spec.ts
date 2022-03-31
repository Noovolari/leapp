import { TestBed } from "@angular/core/testing";

import { AppNativeService } from "./app-native.service";

describe("AppNativeService", () => {
  let service: AppNativeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppNativeService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
