import { INativeService } from "../interfaces/i-native-service";
import { constants } from "../models/constants";
import { Repository } from "./repository";

export class ExecuteService {
  constructor(private nativeService: INativeService, private repository: Repository) {}

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
   * @returns an {Promise<string>} stdout or stderr
   */
  execute(command: string, env?: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let exec = this.nativeService.exec;
      if (command.startsWith("sudo")) {
        exec = this.nativeService.sudo.exec;
        command = command.substring(5, command.length);
      }

      if (this.nativeService.process.platform === "darwin") {
        if (command.indexOf("osascript") === -1) {
          command = "/usr/local/bin/" + command;
        } else {
          command = "/usr/bin/" + command;
        }
      }

      exec(command, { env, name: "Leapp", timeout: 60000 }, (err, stdout, stderr) => {
        this.nativeService.log.info("execute from Leapp: ", { error: err, standardout: stdout, standarderror: stderr });
        if (err) {
          reject(err);
        } else {
          resolve(stdout ? stdout : stderr);
        }
      });
    });
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
    if (this.nativeService.process.platform === "darwin") {
      const terminalType = macOsTerminalType ?? this.repository.getWorkspace().macOsTerminal;
      if (terminalType === constants.macOsTerminal) {
        return this.execute(
          `osascript -e "tell app \\"Terminal\\"
                              activate (do script \\"${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID\\")
                              end tell"`,
          Object.assign(this.nativeService.process.env, env)
        );
      } else {
        return this.execute(
          `osascript -e "tell app \\"iTerm\\"
                              set newWindow to (create window with default profile)
                              tell current session of newWindow
                                write text \\"${command} && unset AWS_SESSION_TOKEN && unset AWS_SECRET_ACCESS_KEY && unset AWS_ACCESS_KEY_ID\\"
                              end tell
                            end tell"`,
          Object.assign(this.nativeService.process.env, env)
        );
      }
    } else if (this.nativeService.process.platform === "win32") {
      return this.execute(`start cmd /k ${command}`, env);
    } else {
      return this.execute(`gnome-terminal -- sh -c "${command}; bash"`, Object.assign(this.nativeService.process.env, env));
    }
  }
}
