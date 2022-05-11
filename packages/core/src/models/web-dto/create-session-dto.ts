import { SessionType } from "../session-type";
import { SessionFieldsDto } from "./session-fields-dto";

export class CreateSessionDto {
  sessionType: SessionType;
  sessionFields: SessionFieldsDto;
}
