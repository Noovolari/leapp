import { TestBed } from "@angular/core/testing";

import { LocalizationService } from "./localization.service";
import i18next from "i18next";

describe("LocalizationService", () => {
  let service: LocalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalizationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("init", async () => {
    const configurationService = {
      userLanguage: "mock-language",
    } as any;
    spyOn(i18next, "use").and.callThrough();
    const localizationService = new LocalizationService(configurationService);
    await localizationService.init();
    expect(i18next.use).toHaveBeenCalled();
  });

  it("localize getter", () => {
    const localizationService = new LocalizationService(null as any);
    const result = localizationService.localize;
    expect(result).toEqual(i18next.t);
  });
});
