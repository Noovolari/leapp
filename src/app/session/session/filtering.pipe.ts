import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../models/session';

@Pipe({
  name: 'filtering'
})
export class FilteringPipe implements PipeTransform {
  transform(sessions: Session[], activeUserSession: boolean): Session[] {
    return sessions.filter(session => activeUserSession ?
                                      (session.active === activeUserSession || session.loading === activeUserSession ) :
                                      (session.active === activeUserSession && session.loading === activeUserSession ));
  }
}
