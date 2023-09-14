import { SessionType } from "../session-type";
import { Session } from "../session";

export class LocalstackSession extends Session {
  endPointUrl: string;
  profileId: string;

  constructor(sessionName: string, region: string, profileId: string) {
    super(sessionName, region);

    this.endPointUrl = "http://localhost:4566";
    this.type = SessionType.localstack;
    this.profileId = profileId;
  }
}
