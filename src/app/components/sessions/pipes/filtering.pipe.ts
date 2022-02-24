import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../../models/session';
import {SessionStatus} from '../../../models/session-status';

@Pipe({
  name: 'filtering'
})
export class FilteringPipe implements PipeTransform {
  transform(sessions: Session[], activeOrPending: boolean): Session[] {
    return sessions.filter(session => activeOrPending ?
      (session.status === SessionStatus.active || session.status === SessionStatus.pending) :
      session.status === SessionStatus.inactive
    );
  }
}
