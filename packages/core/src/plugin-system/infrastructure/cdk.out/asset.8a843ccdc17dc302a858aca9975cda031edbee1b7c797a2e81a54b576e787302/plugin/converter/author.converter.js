"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorConverter = void 0;
class AuthorConverter {
    toModel(dto) {
        return {
            id: dto.id,
            name: dto.name,
            surname: dto.surname,
            email: dto.email
        };
    }
    toDto(dto) {
        return {
            id: dto.id,
            name: dto.name,
            surname: dto.surname,
            email: dto.email
        };
    }
    fromRds(model) {
        return {
            id: model.id,
            name: model.name,
            surname: model.surname,
            email: model.email
        };
    }
}
exports.AuthorConverter = AuthorConverter;
//# sourceMappingURL=author.converter.js.map