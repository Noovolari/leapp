import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";

export default class GenerateSession extends LeappCommand {
  static description = "Generate temporary credentials for the given AWS session id";
  static examples = [`$leapp session generate 0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d`];
  static args = [{ name: "sessionId", description: "id of the session", required: true }];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args } = await this.parse(GenerateSession);
      const selectedSession = await this.getSession(args.sessionId);
      await this.generateSession(selectedSession);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async generateSession(session: Session): Promise<void> {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
    if (this.isAwsSession(sessionService)) {
      const processCredential = await (sessionService as any).generateProcessCredentials(session.sessionId);
      this.log(JSON.stringify(processCredential));
    } else {
      throw new Error("AWS session is required");
    }
  }

  async getSession(sessionId: string): Promise<Session> {
    const selectedSessions = this.cliProviderService.repository.getSessions().filter((session: Session) => session.sessionId === sessionId);
    if (selectedSessions.length === 0) {
      throw new Error("no sessions available");
    } else if (selectedSessions.length > 1) {
      throw new Error("id must be unique");
    }
    return selectedSessions[0];
  }

  isAwsSession(sessionService: SessionService): boolean {
    return sessionService instanceof AwsSessionService;
  }
}
