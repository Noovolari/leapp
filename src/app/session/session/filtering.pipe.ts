import { Pipe, PipeTransform } from '@angular/core';
import {Session} from '../../models/session';

@Pipe({
  name: 'filtering'
})
export class FilteringPipe implements PipeTransform {
  transform(sessions: Session[], active: boolean): Session[] {
    return sessions.filter(session => session.active === active);
  }
}
