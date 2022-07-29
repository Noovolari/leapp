"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConverter = void 0;
class PluginConverter {
    toModel(dto) {
        return {
            pluginName: dto.package.name,
            author: {
                name: dto.package.author.name,
                email: dto.package.author.email
            },
            description: dto.package.description
        };
    }
}
exports.PluginConverter = PluginConverter;
//# sourceMappingURL=plugin.converter.js.map