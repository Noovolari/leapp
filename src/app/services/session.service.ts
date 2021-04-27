import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {Account} from '../models/account';
import {Session} from '../models/session';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends NativeService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  constructor(

  ) { super(); }

  create(account: Account): Session {}

  delete(sessionId: string): void {}

  update(sessionId: string, account: Account, startTime: string, lastStopTime: string, active: boolean, loading: boolean): Session {}

  get(sessionId: string): Session {}

  list(): Session[] {}
}
