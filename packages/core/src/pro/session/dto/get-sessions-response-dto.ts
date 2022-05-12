import { SessionDto } from "./session-dto";

export class GetSessionsResponseDto {
  constructor(public sessions: SessionDto[]) {}
}
