"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConverter = void 0;
class PluginConverter {
    toDto(model) {
        return {
            id: model.id,
            title: model.title,
            author: model.author,
            pubdate: model.pubdate,
            updatedate: model.updatedate,
            email: model.email,
            icon: model.icon,
            url: model.url,
            description: model.description,
            image: model.image
        };
    }
    toListDto(modelList) {
        return modelList.map((model) => this.toDto(model));
    }
    fromRds(model) {
        return {
            id: model.id,
            title: model.plugin_name,
            author: model.surname,
            pubdate: model.created_at,
            updatedate: model.updated_at,
            email: model.email,
            icon: "ICONA",
            url: model.uri,
            description: model.description,
            image: "IMAGE" // TODO
        };
    }
}
exports.PluginConverter = PluginConverter;
//# sourceMappingURL=plugin.converter.js.map