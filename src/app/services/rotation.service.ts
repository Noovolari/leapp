import { Injectable } from '@angular/core';
import {AwsSessionService} from './aws-session.service';
import {SessionProviderService} from './session-provider.service';

@Injectable({
  providedIn: 'root'
})
export class RotationService {

  constructor(
    private sessionService: AwsSessionService,
    private sessionProviderService: SessionProviderService) { }

  rotate(): void {
    const activeSessions = this.sessionService.listActive();
    activeSessions.forEach(session => {
      if (session.expired()) {
        const concreteSessionService = this.sessionProviderService.getService(session.type);
        concreteSessionService.rotate(session.sessionId);
      }
    });
  }
}
