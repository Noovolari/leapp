import { Session } from "@noovolari/leapp-core/models/session";
import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { force, sessionId } from "../../flags";

export default class DeleteSession extends LeappCommand {
  static description = "Delete a session";

  static examples = [
    `$leapp session delete`,
    `$leapp session delete --sessionId SESSIONID`,
    "$leapp session delete --sessionId SESSIONID [--force, -f]",
  ];

  static flags = {
    sessionId,
    force,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(DeleteSession);
      if (this.validateFlags(flags)) {
        const selectedSession = this.cliProviderService.repository.getSessionById(`${flags.sessionId}`);
        if (!selectedSession) {
          throw new Error("Session not found with id " + flags.sessionId);
        }
        const affectedSessions = this.getAffectedSessions(selectedSession);
        if (flags.force || (await this.askForConfirmation(affectedSessions))) {
          await this.deleteSession(selectedSession);
        }
      } else {
        const selectedSession = await this.selectSession();
        const affectedSessions = this.getAffectedSessions(selectedSession);
        if (await this.askForConfirmation(affectedSessions)) {
          await this.deleteSession(selectedSession);
        }
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.repository.getSessions();
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

  async deleteSession(session: Session): Promise<void> {
    try {
      const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
      await sessionService.delete(session.sessionId);
      this.log("session deleted");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  getAffectedSessions(session: Session): Session[] {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
    return sessionService.getDependantSessions(session.sessionId);
  }

  async askForConfirmation(affectedSessions: Session[]): Promise<boolean> {
    if (affectedSessions.length === 0) {
      return true;
    }
    const sessionsList = affectedSessions.map((session) => `- ${session.sessionName}`).join("\n");
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "confirmation",
        message: `deleting this session will delete also these chained sessions\n${sessionsList}\nDo you want to continue?`,
        type: "confirm",
      },
    ]);
    return answer.confirmation;
  }

  private validateFlags(flags: any) {
    return flags.sessionId && flags.sessionId !== "";
  }
}
