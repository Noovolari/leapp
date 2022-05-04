import { SessionFactory } from "./session-factory";
import { Repository } from "./repository";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { Session } from "../models/session";
import { SessionStatus } from "../models/session-status";

export class RegionsService {
  constructor(private sessionFactory: SessionFactory, private repository: Repository, private behaviouralSubjectService: BehaviouralSubjectService) {}

  async changeRegion(session: Session, newRegion: string): Promise<void> {
    const sessionService = this.sessionFactory.getSessionService(session.type);
    const wasActive = session.status === SessionStatus.active;
    if (wasActive) {
      await sessionService.stop(session.sessionId);
    }

    session.region = newRegion;
    this.repository.updateSession(session.sessionId, session);
    this.behaviouralSubjectService.setSessions(this.repository.getSessions());

    if (wasActive) {
      await sessionService.start(session.sessionId);
    }
  }

  getDefaultAwsRegion(): string {
    return this.repository.getDefaultRegion();
  }

  changeDefaultAwsRegion(newDefaultRegion: string): void {
    this.repository.updateDefaultRegion(newDefaultRegion);
  }
}
