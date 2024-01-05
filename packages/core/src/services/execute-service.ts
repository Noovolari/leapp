import { INativeService } from "../interfaces/i-native-service";
import { constants } from "../models/constants";
import { Repository } from "./repository";
import { LoggedEntry, LogLevel, LogService } from "./log-service";

export class ExecuteService {
  constructor(private nativeService: INativeService, private repository: Repository, private logService: LogService) {}

  getQuote(): string {
    return this.nativeService.process.platform === "darwin" ? "'" : "";
  }

  /**
   * Execute a command: if the command contains sudo the system launch it with sudo prompt.
   * Note: with the current version of Electron the sandbox option for Chromium don't allow for sudo prompt on Ubuntu machines 16+
   * Remove the note whenever a fix is found.
   *
   * @param command - the command to launch
   * @param env - environment
   * @param maskOutputLog - to mask logging of secret outputs
   * @returns an {Promise<string>} stdout or stderr
   */
  async execute(command: string, env?: any, maskOutputLog?: boolean): Promise<string> {
    let exec = this.nativeService.exec;
    if (command.startsWith("sudo")) {
      exec = this.nativeService.sudo.exec;
      command = command.substring(5, command.length);
    }
    // NOTE: Electron works in sandbox mode when built.
    // A side effect is that we cannot read the PATH variable to find binary locations.
    // As a workaround, we search a preset list of directories.
    // If this part is modified for some reason,
    // PLEASE TEST BUILD APPLICATION BEFORE RELEASING
    if (this.nativeService.process.platform === "darwin") {
      const [bin] = command.split(" ");
      const directories = ["/usr/bin/", "/usr/local/bin/", "/opt/homebrew/bin/"];
      for (const dir of directories) {
        if (this.nativeService.fs.existsSync(dir + bin)) {
          command = dir + command;
          break;
        }
      }
    }
    // ========================================================
    return await this.exec(exec, command, env, maskOutputLog);
  }

  /**
   * Open a command terminal and launch a generic command
   *
   * @param command - the command to launch in terminal
   * @param env - optional the environment object we can set to pass environment variables
   * @param macOsTerminalType - optional to override terminal type selection on macOS
   * @returns an {Promise<string>} stdout or stderr
   */
  openTerminal(command: string, env?: any, macOsTerminalType?: string): Promise<string> {
    const newEnv = Object.assign({}, this.nativeService.process.env);

    if (this.nativeService.process.platform === "darwin") {
      const terminalType = macOsTerminalType ?? this.repository.getWorkspace().macOsTerminal;
      const path = this.nativeService.os.homedir() + "/" + constants.ssmSourceFileDestination;
      if (terminalType === constants.macOsTerminal) {
        return this.execute(
          `osascript -e 'if application "Terminal" is running then\n
                    \ttell application "Terminal"\n
                    \t\tdo script "source ${path}"\n
                    \t\tdelay 3.5\n
                    \t\tactivate\n
                    \t\tdo script "clear" in window 1\n
                    \t\tdelay 2.5\n
                    \t\tdo script "${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID" in window 1\n
                    \tend tell\n
                    else\n
                    \ttell application "Terminal"\n
                    \t\tdo script "${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID" in window 1\n
                    \t\tactivate\n
                    \tend tell\n
                    end if'`,
          Object.assign(newEnv, env)
        );
      } else if (terminalType === constants.macOsIterm2) {
        return this.execute(
          `osascript -e 'if application "iTerm" is running then\n
                    \ttell application "iTerm"\n
                    \t\tset newWindow to (create window with default profile)\n
                    \t\ttell current session of newWindow\n
                    \t\t\twrite text "source ${path}"\n
                    \t\t\tdelay 3.5\n
                    \t\t\twrite text "clear"\n
                    \t\t\tdelay 2.5\n
                    \t\t\twrite text "${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID"\n
                    \t\tend tell\n
                    \tend tell\n
                    else\n
                    \ttell application "iTerm"\n
                    \t\treopen\n
                    \t\tdelay 1\n
                    \t\ttell current session of current window\n
                    \t\t\twrite text "${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID"\n
                    \t\tend tell\n
                    \tend tell\n
                    end if'`,
          Object.assign(newEnv, env)
        );
      } else if (terminalType === constants.macOsWarp) {
        return this.execute(
          `osascript -e 'if application "Warp" is running then\n
                    \ttell application "Warp"\n
                    \t\tset newWindow to (create window with default profile)\n
                    \t\ttell current session of newWindow\n
                    \t\t\twrite text "source ${path}"\n
                    \t\t\tdelay 3.5\n
                    \t\t\twrite text "clear"\n
                    \t\t\tdelay 2.5\n
                    \t\t\twrite text "${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID"\n
                    \t\tend tell\n
                    \tend tell\n
                    else\n
                    \ttell application "Warp"\n
                    \t\treopen\n
                    \t\tdelay 1\n
                    \t\ttell current session of current window\n
                    \t\t\twrite text "${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID"\n
                    \t\tend tell\n
                    \tend tell\n
                    end if'`,
          Object.assign(newEnv, env)
        );
      }
    } else if (this.nativeService.process.platform === "win32") {
      return this.execute(`start cmd /k ${command}`, env);
    } else {
      return this.execute(`gnome-terminal -- sh -c "${command}; bash"`, Object.assign(newEnv, env));
    }
  }

  openTerminalFromPlugin(command: string, env?: any): Promise<string> {
    const defaultEnv = Object.assign({}, this.nativeService.process.env);
    const executeEnv = Object.assign(defaultEnv, env);
    const pluginEnvPath = this.nativeService.os.homedir() + "/" + constants.pluginEnvFileDestination;
    if (this.nativeService.process.platform === "darwin") {
      return this.execute(
        `osascript -e 'if application "Terminal" is running then\n
                    \ttell application "Terminal"\n
                    \t\tdo script "source ${pluginEnvPath}"\n
                    \t\tdelay 2.5\n
                    \t\tactivate\n
                    \t\tdo script "${command}" in window 1\n
                    \tend tell\n
                    else\n
                    \ttell application "Terminal"\n
                    \t\tdo script "${command}" in window 1\n
                    \t\tactivate\n
                    \tend tell\n
                    end if'`,
        executeEnv
      );
    } else if (this.nativeService.process.platform === "win32") {
      return this.execute(`start cmd /k ${command}`, executeEnv);
    } else {
      return this.execute(`gnome-terminal -- sh -c "${command}; bash"`, executeEnv);
    }
  }

  private async exec(execFn: any, command: string, env: any = undefined, maskOutputLog: boolean = false): Promise<string> {
    // TODO: in case of error, adding stdout and stderr is just a retro-compatible
    //  solution, not the ideal one; we could extract an Info interface and return it
    //  both in reject and resolve cases. This will be a breaking change but
    //  provides all the information needed.
    return new Promise((resolve, reject) => {
      execFn(command, { env, name: "Leapp", timeout: 60000 }, (err, stdout, stderr) => {
        const info = { command, stdout, stderr, error: err };
        if (info.error && info.error.cmd) {
          delete info.error.cmd;
        }
        if (maskOutputLog) {
          Object.assign(info, { stdout: "****", stderr: "****" });
        }
        this.logService.log(new LoggedEntry("execute from Leapp\ninfo:" + JSON.stringify(info, undefined, 4), this, LogLevel.info, false));
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          reject(err);
        } else {
          resolve(stdout ? stdout : stderr);
        }
      });
    });
  }
}
