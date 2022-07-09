import {NpmPackagesDto} from "../dto/npm-packages.dto";
import {PluginModel} from "../model/plugin.model";

export class PluginConverter {
  toModel(dto: NpmPackagesDto): PluginModel {
    return {
      pluginName: dto.package.name,
      author: {
        name: dto.package.author.name,
        email: dto.package.author.email
      },
      description: dto.package.description,
      uri: dto.package.links.npm
    }
  }
}
