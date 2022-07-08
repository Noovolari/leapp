import {AuthorDto} from "../dto/author.dto";
import {AuthorModel} from "../model/author.model";
import {AuthorRdsModel} from "../model/author.rds.model";

export class AuthorConverter {
  toModel(dto: AuthorDto): AuthorModel {
    return {
      id: dto.id,
      name: dto.name,
      surname: dto.surname,
      email: dto.email
    }
  }

  toDto(dto: AuthorModel): AuthorDto {
    return {
      id: dto.id,
      name: dto.name,
      surname: dto.surname,
      email: dto.email
    }
  }

  fromRds(model: AuthorRdsModel): AuthorDto {
    return {
      id: model.id,
      name: model.name,
      surname: model.surname,
      email: model.email
    }
  }
}
