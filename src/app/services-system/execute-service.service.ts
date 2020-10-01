import { Injectable } from '@angular/core';
import { NativeService } from './native-service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExecuteServiceService extends NativeService {
  /**
   * Execute a command: if the command contains sudo the system launch it with sudo prompt.
   * Note: with the current version of Electron the sandbox option for Chromium don't allow for sudo prompt on Ubuntu machines 16+
   * Remove the note whenever a fix is found.
   * @param command - the command to launch
   * @returns an {Observable<any>} to use for subscribing to success or error event on the command termination:
   *          the default unix standard is used so 0 represent a success code, everything elese is an error code
   */
  public execute(command: string, force?: boolean): Observable<any> {
    return new Observable(
      subscriber => {
        if (force) {
          subscriber.next('');
          subscriber.complete();
        }

        let exec = this.exec;
        if (command.startsWith('sudo')) {
          exec = this.sudo.exec;
          command = command.substring(5, command.length);
        }

        if (this.process.platform === 'darwin') {
          if (command.indexOf('osascript') === -1) {
            command = '/usr/local/bin/' + command;
          } else {
            command = '/usr/bin/' + command;
          }
        }

        exec(command, {name: 'Leapp', timeout: 60000 }, (err, stdout, stderr) => {
          this.log.info('execute from Leapp: ', {error: err, standardout: stdout, standarderror: stderr});
          if (err) {
            subscriber.error(err);
          } else {
            subscriber.next(stdout ? stdout : stderr);
          }
          subscriber.complete();
        });
      }
    );
  }

  /**
   * Open a command terminal and launch a generic command
   * @param command - the command to launch in terminal
   * @returns an {Observable<any>} to subscribe to
   */
  public openTerminal(command: string): Observable<any> {
    return this.execute(`osascript -e "tell app \\"Terminal\\"
                              do script \\"${command}\\"
                              end tell"`);
  }
}
