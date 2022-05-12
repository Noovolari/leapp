import { SessionDto } from "./session-dto";

export class SetSessionsRequestDto {
  constructor(public sessions: SessionDto[]) {}
}
