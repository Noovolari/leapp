import { PluginRdsModel } from "../model/plugin.rds.model";
import { PluginDto } from "../dto/plugin.dto";
import { PluginModel } from "../model/plugin.model";
export declare class PluginConverter {
    toDto(model: PluginModel): PluginDto;
    toListDto(modelList: PluginModel[]): PluginDto[];
    fromRds(model: PluginRdsModel): PluginModel;
}
