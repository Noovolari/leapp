import {PluginRdsModel} from "../model/plugin.rds.model";
import {PluginDto} from "../dto/plugin.dto";
import {PluginModel} from "../model/plugin.model";
import {AuthorConverter} from "./author.converter";
import {StatusConverter} from "./status.converter";

export class PluginConverter {
  toDto(model: PluginModel): PluginDto {
    return {
      id: model.pluginName,
      title: model.pluginName,
      author: model.author.name + model.author.surname,
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
      id: model.uri,
      pluginName: model.plugin_name,
      author: new AuthorConverter().fromRds({
        id: model.a_id,
        name: model.a_name,
        surname: model.a_surname,
        email: model.a_email
      }),
      description: model.description,
      tags: model.tags,
      uri: model.uri,
      signature: model.signature,
      hash: model.hash,
      status: new StatusConverter().fromRds({
        id: model.s_id,
        name: model.s_name
      }),
      createdAt: model.created_at,
      updatedAt: model.updated_at
    }
  }
}
