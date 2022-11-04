import { SessionFactory } from "./session-factory";
import { Repository } from "./repository";
import { TrackingService } from "./tracking/tracking-service";

export class RotationService {
  constructor(private sessionServiceFactory: SessionFactory, private repository: Repository, private trackingService: TrackingService) {}

  rotate(): void {
    const activeSessions = this.repository.listActive();
    activeSessions.forEach((session) => {
      if (session.expired()) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(session.type);
        concreteSessionService.rotate(session.sessionId).then((_) => {
          this.trackingService.addToRotationByType(session);
        }); // TODO: catch and log async exceptions
      }
    });
  }
}
