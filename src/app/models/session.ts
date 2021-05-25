import * as uuid from 'uuid';
import {environment} from '../../environments/environment';
import {SessionStatus} from './session-status';
import {SessionType} from './session-type';

export class Session {

  sessionId: string;
  sessionName: string;
  type: SessionType;
  status: SessionStatus;

  region: string;
  startDateTime: string;
  lastStopDateTime: string;

  constructor(sessionName: string, region: string) {
    this.sessionId = uuid.v4();
    this.sessionName = sessionName;
    this.status = SessionStatus.inactive;

    this.region = region;
    this.startDateTime = undefined;
    this.lastStopDateTime = new Date().toISOString();
  }

  expired(): boolean {
    const currentTime = new Date().getTime();
    const startTime = new Date(this.startDateTime).getTime();
    return (currentTime - startTime) / 1000 > environment.sessionDuration;
  };
}
