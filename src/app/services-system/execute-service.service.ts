import { Injectable } from '@angular/core';
import { NativeService } from './native-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExecuteServiceService extends NativeService {

  // This is used to interrupt an install procedure
  private interrupted = false;

  // The commands for installing the dependencies in the different operative system
  // Now the are not used as per MVP request we only check for aws_cli_check
  private commands = {
    mac: {
      aws_cli_check: {command: '/usr/local/bin/aws --version'},
      python_check: {command: 'python --version'},
      commands: [
        {label: 'Getting Aws Cli Bundled', command: 'curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"'},
        {label: 'Extracting the bundle', command: 'unzip awscli-bundle.zip'},
        {label: 'Personal Aws Cli Install', command: './awscli-bundle/install -i ~/.local/eddie && ~/.local/eddie/bin/pip install --no-cache-dir --no-index --find-links=file:///Users/urz9999/Projects/Javascript/noovolari-eddie-client/awscli-bundle/packages/ awscli'},
        {label: 'Clear all temp files', command: 'rm -Rf aws-cli-bundle.zip && rm -Rf aws-cli-bundle'}
      ]
    },
    windows: {
      aws_cli_check: {command: '"C:\\Program Files\\Amazon\\AWSCLI\\bin\\aws" --version'},
      python_check: {command: 'python --version'},
      commands: [
        {label: 'python3', command: 'bitsadmin /transfer myDownloadJob /download /priority normal https://www.python.org/ftp/python/3.7.4/python-3.7.4-amd64.exe "c:\\Users\\%username%\\Desktop\\python-3.7.4-amd64.exe"'},
        {label: 'install', command: '"c:\\Users\\%username%\\Desktop\\python-3.7.4-amd64.exe"'},
        {label: 'aws-cli', command: 'pip install awscli'},
        {label: 'upgrade', command: 'pip install --user --upgrade awscli'}
      ]
    },
    linux: {
      aws_cli_check: {command: 'whoami && ~/.local/bin/aws --version'},
      python_check: {command: 'python --version'},
      commands: [
        {label: 'Getting Aws Cli Bundled', command: 'curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip" > /dev/null 2>&1 || wget "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -O "awscli-bundle.zip" > /dev/null 2>&1'},
        {label: 'Extracting the bundle', command: 'unzip awscli-bundle.zip'},
        {label: 'Personal Aws Cli Install', command: './awscli-bundle/install -i ~/.local/eddie'},
        {label: 'Clear all temp files', command: 'rm -Rf aws-cli-bundle.zip && rm -Rf aws-cli-bundle'}
      ]
    }
  };

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

        exec(command, {name: 'Leapp'}, (err, stdout, stderr) => {
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

  /* ============================================================================================= */
  /* Wizard helpers methods we use these to simplify the use of different commands on different OS */
  /* ============================================================================================= */
  public getAwsCliCheck(os: string) {
    return this.commands[os].aws_cli_check.command;
  }

  public getPythonCheck(os: string) {
    return this.commands[os].python_check.command;
  }

  public getCommand(os: string, index: number) {
    return this.commands[os].commands[index].command;
  }

  public getCommandLabel(os: string, index: number) {
    return this.commands[os].commands[index].label;
  }

  public getCommandLabels(os: string) {
    return this.commands[os].commands.map((i) => i.label);
  }

  public getCommandsLength(os: string) {
    return this.commands[os].commands.length;
  }

  public toggleInterrupted(interrupt: boolean) {
    this.interrupted = interrupt;
  }
}
