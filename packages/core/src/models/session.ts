import * as uuid from "uuid";
import { SessionStatus } from "./session-status";
import { SessionType } from "./session-type";
import { constants } from "./constants";

export class Session {
  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  startDateTime?: string;
  region: string;
  type: SessionType;

  constructor(sessionName: string, region: string) {
    this.sessionId = uuid.v4();
    this.sessionName = sessionName;
    this.status = SessionStatus.inactive;
    this.startDateTime = undefined;
    this.region = region;
  }

  expired(): boolean {
    if (this.startDateTime === undefined) {
      return false;
    }
    const currentTime = new Date().getTime();
    const startTime = new Date(this.startDateTime).getTime();
    return (currentTime - startTime) / 1000 > constants.sessionDuration;
  }
}
