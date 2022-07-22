import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@hesketh-racing/leapp-core/models/session";
import { SessionStatus } from "@hesketh-racing/leapp-core/models/session-status";
import { sessionId } from "../../flags";

export default class StopSession extends LeappCommand {
  static description = "Stop a session";

  static examples = [`$leapp session stop`, `$leapp session stop --sessionId SESSIONID`];

  static flags = {
    sessionId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(StopSession);
      if (flags.sessionId && flags.sessionId !== "") {
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId);
        if (!selectedSession) {
          throw new Error("No session found with id " + flags.sessionId);
        }
        await this.stopSession(selectedSession);
      } else {
        const selectedSession = await this.selectSession();
        await this.stopSession(selectedSession);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async stopSession(session: Session): Promise<void> {
    try {
      const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
      await sessionService.stop(session.sessionId);
      this.log("session stopped");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService
      .getSessions()
      .filter((session: Session) => session.status === SessionStatus.active || session.status === SessionStatus.pending);
    if (availableSessions.length === 0) {
      throw new Error("no active sessions available");
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
