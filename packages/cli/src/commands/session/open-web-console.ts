import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { sessionId } from "../../flags";

export default class OpenWebConsole extends LeappCommand {
  static description = "Open an AWS Web Console";

  static examples = [`$leapp session open-web-console`, `$leapp session open-web-console --sessionId SESSIONID`];

  static flags = {
    sessionId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(OpenWebConsole);
      if (flags.sessionId && flags.sessionId !== "") {
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId);
        if (!selectedSession) {
          throw new Error("No session found with id " + flags.sessionId);
        }
        await this.openWebConsole(selectedSession);
      } else {
        const selectedSession = await this.selectSession();
        await this.openWebConsole(selectedSession);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async openWebConsole(session: Session): Promise<void> {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    const credentials = await sessionService.generateCredentials(session.sessionId);
    try {
      await this.cliProviderService.webConsoleService.openWebConsole(credentials, session.region);
    } catch (e) {
      console.log(e);
      throw e;
    }
    this.log("opened AWS Web Console for this session");
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
