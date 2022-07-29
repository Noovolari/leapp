import { NpmPackagesDto } from "../dto/npm-packages.dto";
import { PluginModel } from "../model/plugin.model";
export declare class PluginConverter {
    toModel(dto: NpmPackagesDto): PluginModel;
}
