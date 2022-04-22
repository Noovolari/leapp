import { TestBed } from "@angular/core/testing";

import { AppMfaCodePromptService } from "./app-mfa-code-prompt.service";
import { mustInjected } from "../../base-injectables";

describe("AppMfaCodePromptService", () => {
  let service: AppMfaCodePromptService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected()),
    });
    service = TestBed.inject(AppMfaCodePromptService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
