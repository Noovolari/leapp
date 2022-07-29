"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConverter = void 0;
class PluginConverter {
    toDto(model) {
        return {
            id: model.id,
            title: model.title,
            author: model.author,
            pubdate: model.pubdate.toISOString(),
            updatedate: model.updatedate.toISOString(),
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
            id: model["p.id"],
            title: model["p.plugin_name"],
            author: model["a.name"] + model["a.surname"],
            pubdate: new Date(model["p.created_at"]),
            updatedate: new Date(model["p.updated_at"]),
            email: model["a.email"],
            icon: "ICONA",
            url: model["p.uri"],
            description: model["p.description"],
            image: "IMAGE" // TODO
        };
    }
}
exports.PluginConverter = PluginConverter;
//# sourceMappingURL=plugin.converter.js.map