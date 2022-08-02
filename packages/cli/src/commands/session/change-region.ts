import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { region, sessionId } from "../../flags";

export default class ChangeSessionRegion extends LeappCommand {
  static description = "Change a session region";

  static examples = [`$leapp session change-region`, `$leapp session change-region --sessionId SESSIONID --region REGION`];

  static flags = {
    sessionId,
    region,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  private static areFlagsNotDefined(flags: any): boolean {
    return flags.sessionId === undefined && flags.region === undefined;
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(ChangeSessionRegion);
      if (ChangeSessionRegion.areFlagsNotDefined(flags)) {
        const selectedSession = await this.selectSession();
        const selectedRegion = await this.selectRegion(selectedSession);
        await this.changeSessionRegion(selectedSession, selectedRegion);
      } else {
        if (this.validateFlags(flags)) {
          const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(`${flags.sessionId}`);
          const selectedRegion = this.cliProviderService.awsCoreService.getRegions().find((r) => r.region === flags.region);
          if (!selectedSession) {
            throw new Error("No session with id " + flags.sessionId + " found");
          }
          if (!selectedRegion) {
            throw new Error("No region with name " + flags.region + " found");
          }
          await this.changeSessionRegion(selectedSession, `${flags.region}`);
        }
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService.getSessions();

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session) => ({ name: session.sessionName, value: session })),
      },
    ]);
    return answer.selectedSession;
  }

  async selectRegion(session: Session): Promise<string> {
    const availableRegions = this.cliProviderService.cloudProviderService.availableRegions(session.type);

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedRegion",
        message: `current region is ${session.region}, select a new region`,
        type: "list",
        choices: availableRegions.map((r) => ({ name: r.fieldName, value: r.fieldValue })),
      },
    ]);
    return answer.selectedRegion;
  }

  async changeSessionRegion(session: Session, newRegion: string): Promise<void> {
    try {
      await this.cliProviderService.regionsService.changeRegion(session, newRegion);
      this.log("session region changed");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  private validateFlags(flags: any): boolean {
    if (flags.sessionId === undefined || flags.region === undefined) {
      throw new Error("flags --sessionId and --region must all be specified");
    }
    if (flags.sessionId === "") {
      throw new Error("Session Id must not be empty");
    }
    if (flags.region === "") {
      throw new Error("Region must not be empty");
    }
    return true;
  }
}
