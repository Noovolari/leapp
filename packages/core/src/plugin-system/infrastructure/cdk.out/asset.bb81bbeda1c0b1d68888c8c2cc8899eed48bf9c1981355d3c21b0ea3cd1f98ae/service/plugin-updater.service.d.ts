import { Service } from "../core/service";
import { PluginModel } from "../model/plugin.model";
export declare class PluginUpdaterService extends Service {
    private readonly dataApiConnector;
    constructor(region: string);
    updateRds(pluginModelList: PluginModel[]): Promise<void>;
}
