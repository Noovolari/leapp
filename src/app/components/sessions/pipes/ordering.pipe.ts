import { Pipe, PipeTransform } from '@angular/core';
import {Session} from '../../../models/session';

@Pipe({
  name: 'ordering'
})
export class OrderingPipe implements PipeTransform {

  transform(sessions: Session[], asc?: boolean): Session[] {
    return sessions.sort((a: Session, b: Session) => {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      if (asc) {
       const c = b; b = a; a = c;
      }
      return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
    });
  }
}
