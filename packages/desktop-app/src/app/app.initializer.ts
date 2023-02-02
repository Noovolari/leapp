import { LocalizationService } from "leapp-angular-common";

export const appInitializer =
  (localizationService: LocalizationService): (() => Promise<void>) =>
  async () => {
    await localizationService.init();
  };
