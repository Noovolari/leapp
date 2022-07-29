"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorConverter = void 0;
class AuthorConverter {
    toModel(dto) {
        return {
            id: dto.id,
            name: dto.name,
            email: dto.email
        };
    }
    toDto(dto) {
        return {
            id: dto.id,
            name: dto.name,
            email: dto.email
        };
    }
    fromRds(model) {
        return {
            id: model.id,
            name: model.name,
            email: model.email
        };
    }
}
exports.AuthorConverter = AuthorConverter;
//# sourceMappingURL=author.converter.js.map