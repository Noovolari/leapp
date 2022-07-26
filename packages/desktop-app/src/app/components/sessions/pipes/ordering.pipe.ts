import { Pipe, PipeTransform } from "@angular/core";
import { Session } from "@noovolari/leapp-core/models/session";

@Pipe({
  name: "ordering",
})
export class OrderingPipe implements PipeTransform {
  transform(sessions: Session[], asc?: boolean): Session[] {
    return sessions.sort((a: Session, b: Session) => {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      if (asc) {
        const c = b;
        b = a;
        a = c;
      }

      if (!a.startDateTime) {
        a.startDateTime = new Date("1970-01-01T00:00:00+0000").toISOString();
      }

      if (!b.startDateTime) {
        b.startDateTime = new Date("1970-01-01T00:00:00+0000").toISOString();
      }

      return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
    });
  }
}
