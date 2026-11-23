import { IOpenExternalUrlService } from "@noovolari/leapp-core/interfaces/i-open-external-url-service";
import { assertExternalUrl } from "@noovolari/leapp-core/services/external-url";
import open from "open";

export class CliOpenWebConsoleService implements IOpenExternalUrlService {
  async openExternalUrl(url: string): Promise<void> {
    assertExternalUrl(url, this);
    await open(url);
  }
}
