import { StatusDto } from "../dto/status.dto";
import { StatusModel } from "../model/status.model";
import { StatusRdsModel } from "../model/status.rds.model";
export declare class StatusConverter {
    toModel(dto: StatusDto): StatusModel;
    toDto(dto: StatusModel): StatusDto;
    fromRds(model: StatusRdsModel): StatusDto;
}
