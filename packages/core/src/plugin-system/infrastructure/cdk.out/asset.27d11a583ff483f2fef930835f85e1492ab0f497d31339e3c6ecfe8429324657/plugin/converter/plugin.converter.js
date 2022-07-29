"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConverter = void 0;
const author_converter_1 = require("./author.converter");
const status_converter_1 = require("./status.converter");
class PluginConverter {
    toDto(model) {
        return {
            id: model.id,
            title: model.pluginName,
            author: model.author.name + model.author.surname,
            pubdate: model.createdAt,
            updatedate: model.updatedAt,
            status: model.status.name,
            uri: model.uri,
            description: model.description,
            icon: "ICONA",
            image: "IMAGE" // TODO
        };
    }
    toListDto(modelList) {
        return modelList.map((model) => this.toDto(model));
    }
    fromRds(model) {
        return {
            id: model.uri,
            pluginName: model.plugin_name,
            author: new author_converter_1.AuthorConverter().fromRds({
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
            status: new status_converter_1.StatusConverter().fromRds({
                id: model.s_id,
                name: model.s_name
            }),
            createdAt: model.created_at,
            updatedAt: model.updated_at
        };
    }
}
exports.PluginConverter = PluginConverter;
//# sourceMappingURL=plugin.converter.js.map