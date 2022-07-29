import { Service } from "../../core/service";
import { PluginExtendedModel } from "../model/plugin-extended.model";
export declare class PluginService extends Service {
    private dataApiConnector;
    private pluginConverter;
    constructor(region: string);
    listPlugin(queryParam?: string): Promise<PluginExtendedModel[]>;
    getPlugin(pluginId: string): Promise<PluginExtendedModel>;
}
