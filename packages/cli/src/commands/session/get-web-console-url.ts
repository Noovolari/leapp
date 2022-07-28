import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { sessionId } from "../../flags";

export default class GetWebConsoleUrl extends LeappCommand {
  static description = "Get an AWS Web Console Url";

  static examples = [`$leapp session get-web-console-url`, `$leapp session get-web-console-url --sessionId SESSIONID`];

  static flags = {
    sessionId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(GetWebConsoleUrl);
      if (flags.sessionId && flags.sessionId !== "") {
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId);
        if (!selectedSession) {
          throw new Error("No session found with id " + flags.sessionId);
        }
        const loginURL = await this.getWebConsoleUrl(selectedSession);
        this.log(loginURL);
      } else {
        const selectedSession = await this.selectSession();
        const loginURL = await this.getWebConsoleUrl(selectedSession);
        this.log(loginURL);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async getWebConsoleUrl(session: Session): Promise<string> {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    const credentials = await sessionService.generateCredentials(session.sessionId);
    try {
      const loginURL = await this.cliProviderService.webConsoleService.getWebConsoleUrl(credentials, session.region);
      return loginURL;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  private async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService
      .getSessions()
      .filter((session: Session) => session.status === SessionStatus.inactive && session.type !== SessionType.azure);
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session: any) => ({ name: session.sessionName, value: session })),
      },
    ]);
    return answer.selectedSession;
  }
}
