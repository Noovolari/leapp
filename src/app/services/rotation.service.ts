import { Injectable } from '@angular/core';
import {SessionService} from "./session.service";
import {SessionProviderService} from "./session-provider.service";

@Injectable({
  providedIn: 'root'
})
export class RotationService {

  constructor(
    private sessionService: SessionService,
    private sessionProviderService: SessionProviderService) { }

  rotate(): void {
    const activeSessions = this.sessionService.listActive();
    activeSessions.forEach(session => {
      if (session.expired()) {
        const concreteSessionService = this.sessionProviderService.getService(session.account.type);
        concreteSessionService.rotate(session.sessionId);
      }
    });
  }
}
