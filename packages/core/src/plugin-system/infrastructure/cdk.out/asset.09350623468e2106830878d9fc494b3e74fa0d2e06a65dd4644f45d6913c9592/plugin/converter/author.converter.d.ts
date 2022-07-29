import { AuthorDto } from "../dto/author.dto";
import { AuthorModel } from "../model/author.model";
import { AuthorRdsModel } from "../model/author.rds.model";
export declare class AuthorConverter {
    toModel(dto: AuthorDto): AuthorModel;
    toDto(dto: AuthorModel): AuthorDto;
    fromRds(model: AuthorRdsModel): AuthorDto;
}
