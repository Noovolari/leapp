import {Logger} from "./core/logger";
import {SignatureUpdaterService} from "./service/signature-updater.service";
import {environment} from "./environments/environment";

export async function handler(event: any) {
  Logger.debug(event);
  await new SignatureUpdaterService(environment.REGION).updateRds(
    event.pluginName,
    event.hash,
    event.signature
  );
}
