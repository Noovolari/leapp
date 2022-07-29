import { Service } from "../core/service";
import { NpmPackagesDto } from "../dto/npm-packages.dto";
export declare class PluginUpdaterService extends Service {
    private readonly dataApiConnector;
    constructor(region: string);
    updateRds(npmPackagesDto: NpmPackagesDto[]): Promise<void>;
}
