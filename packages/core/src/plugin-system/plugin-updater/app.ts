import {Logger} from "./core/logger";
import {NpmPackagesDto} from "./dto/npm-packages.dto";
import * as axios from "axios";
import {PluginConverter} from "./converter/plugin.converter";
import {PluginUpdaterService} from "./service/plugin-updater.service";
import {environment} from "./environments/environment";


export async function handler(event: any) {
  const npmPackagesDto: NpmPackagesDto[] = (await axios.default.request({
    baseURL: "https://registry.npmjs.org/-/v1/",
    url: "search",
    method: "GET",
    params: {text: "leapp-plugin"}
  })).data.objects;
  Logger.debug(npmPackagesDto);
  await new PluginUpdaterService(environment.REGION).updateRds(npmPackagesDto);
}
