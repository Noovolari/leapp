import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";

export default class StopSession extends LeappCommand {
  static description = "Stop a session";

  static examples = [`$leapp session stop`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      await this.stopSession(selectedSession);
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
    const availableSessions = this.cliProviderService.repository
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
