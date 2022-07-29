import { Service } from "../../core/service";
import { PluginModel } from "../model/plugin.model";
export declare class PluginService extends Service {
    private dataApiConnector;
    private pluginConverter;
    constructor(region: string);
    listPlugin(queryParam?: string): Promise<PluginModel[]>;
    getPlugin(pluginName: string): Promise<PluginModel>;
}
