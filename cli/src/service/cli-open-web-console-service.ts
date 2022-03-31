import { IOpenExternalUrlService } from "@noovolari/leapp-core/interfaces/i-open-external-url-service";
import open from "open";

export class CliOpenWebConsoleService implements IOpenExternalUrlService {
  async openExternalUrl(url: string): Promise<void> {
    await open(url);
  }
}
