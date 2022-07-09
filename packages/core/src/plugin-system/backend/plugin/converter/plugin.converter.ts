import {PluginRdsModel} from "../model/plugin.rds.model";
import {PluginDto} from "../dto/plugin.dto";
import {PluginModel} from "../model/plugin.model";

export class PluginConverter {
  toDto(model: PluginModel): PluginDto {
    return {
      id: model.pluginName,
      title: model.pluginName,
      author: model.author.name,
      pubdate: model.createdAt,
      updatedate: model.updatedAt,
      status: model.status.name,
      uri: model.uri,
      description: model.description,
      icon: "ICONA", // TODO
      image: "IMAGE" // TODO
    }
  }

  toListDto(modelList: PluginModel[]): PluginDto[] {
    return modelList.map((model) => this.toDto(model))
  }

  fromRds(model: PluginRdsModel): PluginModel {
    return {
      pluginName: model.plugin_name,
      author: {
        id: model.a_id,
        name: model.a_name,
        email: model.a_email
      },
      description: model.description,
      tags: model.tags,
      uri: model.uri,
      signature: model.signature,
      hash: model.hash,
      status:{
        id: model.s_id,
        name: model.s_name
      },
      createdAt: model.created_at,
      updatedAt: model.updated_at
    }
  }
}
