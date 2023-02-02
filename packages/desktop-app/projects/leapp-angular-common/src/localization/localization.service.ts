import { Injectable } from "@angular/core";
import i18next, { TFunction } from "i18next";
import Backend from "i18next-http-backend";
import { ConfigurationService } from "../configuration/configuration.service";

@Injectable({ providedIn: "root" })
export class LocalizationService {
  constructor(private readonly configurationService: ConfigurationService) {}

  async init(): Promise<void> {
    await i18next.use(Backend).init({
      lng: this.configurationService.userLanguage,
      fallbackLng: "en",
      debug: false,
      backend: { loadPath: "assets/locales/{{lng}}.json" },
    });
  }

  public get localize(): TFunction {
    return i18next.t;
  }
}
