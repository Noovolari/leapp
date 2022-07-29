import { PluginRdsModel } from "../model/plugin.rds.model";
import { PluginExtendedModel } from "../model/plugin-extended.model";
import { PluginDto } from "../dto/plugin.dto";
export declare class PluginConverter {
    toDto(model: PluginExtendedModel): PluginDto;
    toListDto(modelList: PluginExtendedModel[]): PluginDto[];
    fromRds(model: PluginRdsModel): PluginExtendedModel;
}
