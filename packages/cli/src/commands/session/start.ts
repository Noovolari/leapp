import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { sessionId } from "../../flags";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";
import { AzureSession } from "@noovolari/leapp-core/models/azure/azure-session";

export default class StartSession extends LeappCommand {
  static description = "Start a session";

  static examples = [`$leapp session start`, `$leapp session start --sessionId SESSIONID`];

  static flags = {
    sessionId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(StartSession);
      if (flags.sessionId && flags.sessionId !== "") {
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId);
        if (!selectedSession) {
          throw new Error("No session with id " + flags.sessionId + " found");
        }
        await this.startSession(selectedSession);
      } else {
        const selectedSession = await this.selectSession();
        await this.startSession(selectedSession);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async startSession(session: Session): Promise<void> {
    if (session.status === SessionStatus.active) {
      throw new Error("session already started");
    }
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
    process.on("SIGINT", () => {
      sessionService.sessionDeactivated(session.sessionId);
      process.exit(0);
    });
    try {
      await sessionService.start(session.sessionId);
      this.log("session started");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService
      .getSessions()
      .filter((session: Session) => session.status === SessionStatus.inactive);
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session: Session) => ({
          name: `${session.sessionName} ${this.secondarySessionInfo(session) ? "- " + this.secondarySessionInfo(session) : ""}`,
          value: session,
        })),
      },
    ]);
    return answer.selectedSession;
  }

  secondarySessionInfo(session: Session): string {
    switch (session.type) {
      case SessionType.awsIamRoleFederated:
        return (session as AwsIamRoleFederatedSession).roleArn.split("role/")[1] || "";
      case SessionType.awsIamRoleChained:
        return (session as AwsIamRoleChainedSession).roleArn.split("role/")[1] || "";
      case SessionType.awsIamUser:
        return "";
      case SessionType.awsSsoRole:
        const splittedRoleArn = (session as AwsSsoRoleSession).roleArn.split("/");
        splittedRoleArn.splice(0, 1);
        return splittedRoleArn.join("/");
      case SessionType.azure:
        return (session as AzureSession).subscriptionId;
    }
    return "ciao";
  }
}
