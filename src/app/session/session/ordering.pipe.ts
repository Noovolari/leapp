import { Pipe, PipeTransform } from '@angular/core';
import {Session} from '../../models/session';

@Pipe({
  name: 'ordering'
})
export class OrderingPipe implements PipeTransform {

  transform(sessions: Session[]): Session[] {
    return sessions.sort((a: Session, b: Session) => {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(b.lastStopDateTime).getTime() - new Date(a.lastStopDateTime).getTime();
    });
  }

}
