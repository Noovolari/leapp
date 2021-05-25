import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../models/session';
import {SessionStatus} from '../../models/session-status';
import {environment} from '../../../environments/environment';

@Pipe({
  name: 'icon'
})
export class IconPipe implements PipeTransform {
  transform(session: Session, name: string): string {
    const color = session.status === SessionStatus.active ? ' orange' : '';
    return name === environment.defaultAwsProfileName ? ('home' + color) : ('user' + color);
  }
}
