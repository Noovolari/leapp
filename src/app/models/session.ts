import * as uuid from 'uuid';
import {environment} from '../../environments/environment';
import {SessionStatus} from './session-status';
import {SessionType} from './session-type';

export class Session {

  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  startDateTime: string;
  duration: number;
  region: string;
  type: SessionType;

  constructor(sessionName: string, region: string) {
    this.sessionId = uuid.v4();
    this.sessionName = sessionName;
    this.status = SessionStatus.inactive;
    this.startDateTime = undefined;
    this.duration = environment.sessionDuration;
    this.region = region;
  }

  expired(): boolean {
    const currentTime = new Date().getTime();
    const startTime = new Date(this.startDateTime).getTime();
    return (currentTime - startTime) / 1000 > this.duration;
  };
}
