import { TestBed } from "@angular/core/testing";

import { AppProviderService } from "./app-provider.service";
import { mustInjected } from "../../base-injectables";

describe("AppProviderService", () => {
  let service: AppProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected()),
    });
    service = TestBed.inject(AppProviderService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
