import {StatusDto} from "../dto/status.dto";
import {StatusModel} from "../model/status.model";
import {StatusRdsModel} from "../model/status.rds.model";

export class StatusConverter {
  toModel(dto: StatusDto): StatusModel {
    return {
      id: dto.id,
      name: dto.name
    }
  }

  toDto(dto: StatusModel): StatusDto {
    return {
      id: dto.id,
      name: dto.name
    }
  }

  fromRds(model: StatusRdsModel): StatusDto {
    return {
      id: model.id,
      name: model.name
    }
  }
}
