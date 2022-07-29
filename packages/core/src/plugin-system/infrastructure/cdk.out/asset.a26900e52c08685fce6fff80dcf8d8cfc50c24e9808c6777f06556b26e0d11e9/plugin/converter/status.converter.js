"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusConverter = void 0;
class StatusConverter {
    toModel(dto) {
        return {
            id: dto.id,
            name: dto.name
        };
    }
    toDto(dto) {
        return {
            id: dto.id,
            name: dto.name
        };
    }
    fromRds(model) {
        return {
            id: model.id,
            name: model.name
        };
    }
}
exports.StatusConverter = StatusConverter;
//# sourceMappingURL=status.converter.js.map