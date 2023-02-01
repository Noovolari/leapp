import { SessionFactory } from "./session-factory";
import { Repository } from "./repository";

export class RotationService {
  constructor(private sessionServiceFactory: SessionFactory, private repository: Repository) {}

  rotate(): void {
    const activeSessions = this.repository.listActive();
    activeSessions.forEach((session) => {
      if (session.expired()) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(session.type);
        concreteSessionService.rotate(session.sessionId).then((_) => {});
      }
    });
  }
}
