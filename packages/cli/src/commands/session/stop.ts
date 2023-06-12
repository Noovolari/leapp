import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { sessionRole, sessionId, noInteractive } from "../../flags";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";
import { AzureSession } from "@noovolari/leapp-core/models/azure/azure-session";
import { Args } from "@oclif/core";

export default class StopSession extends LeappCommand {
  static description = "Stop a session";

  static examples = [
    `$leapp session stop`,
    `$leapp session stop SESSIONNAME`,
    `$leapp session stop SESSIONNAME --sessionRole SESSIONROLE`,
    `$leapp session stop SESSIONNAME --noInteractive`,
    `$leapp session stop --sessionId SESSIONID`,
  ];

  static flags = {
    sessionId,
    sessionRole,
    noInteractive,
  };

  static args = {
    sessionName: Args.string({ required: false, description: "Name of the Leapp session" }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args, flags } = await this.parse(StopSession);
      let sessionNameFilter: string | undefined;
      let sessionRoleFilter: string | undefined;
      if (args.sessionName) {
        sessionNameFilter = args.sessionName;
      }
      if (flags.sessionRole && flags.sessionRole !== "") {
        sessionRoleFilter = flags.sessionRole;
      }
      const sessions = this.cliProviderService.sessionManagementService.getSessions();

      const selectedSessions = sessions
        .filter((s: Session) => (sessionNameFilter ? s.sessionName.includes(sessionNameFilter) : true))
        .filter((s: Session) => (sessionRoleFilter ? ((s as any).roleArn ? (s as any).roleArn.split("/")[1] === sessionRoleFilter : true) : true))
        .filter((s: Session) => (flags.sessionId && flags.sessionId !== "" ? s.sessionId === flags.sessionId : true));

      if (!selectedSessions || selectedSessions.length === 0 || (selectedSessions.length > 1 && flags.noInteractive)) {
        throw new Error("No sessions found");
      } else if (selectedSessions.length === 1) {
        await this.stopSession(selectedSessions[0]);
      } else {
        const selectedSession = await this.selectSession(selectedSessions);
        await this.stopSession(selectedSession);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async stopSession(session: Session): Promise<void> {
    if (session.status === SessionStatus.inactive) {
      throw new Error("session already stopped");
    }
    try {
      const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
      await sessionService.stop(session.sessionId);
      this.log("session stopped");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  async selectSession(selectedSessions: Session[]): Promise<Session> {
    const availableSessions = selectedSessions.filter(
      (session: Session) => session.status === SessionStatus.active || session.status === SessionStatus.pending
    );
    if (availableSessions.length === 0) {
      throw new Error("no active sessions available");
    }
    if (availableSessions.length === 1) {
      return availableSessions[0];
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session: Session) => ({
          name: `${session.sessionName}${this.secondarySessionInfo(session) ? " - " + this.secondarySessionInfo(session) : ""}`,
          value: session,
        })),
      },
    ]);
    return answer.selectedSession;
  }

  secondarySessionInfo(session: Session): string | undefined {
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
    return undefined;
  }
}
