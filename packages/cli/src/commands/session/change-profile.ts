import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { profileId, sessionId } from "../../flags";

export default class ChangeSessionProfile extends LeappCommand {
  static description = "Change a session named-profile";

  static examples = [`$leapp session change-profile`, `$leapp session change-profile --profileId PROFILEID --sessionId SESSIONID`];

  static flags = {
    sessionId,
    profileId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  private static areFlagsNotDefined(flags: any): boolean {
    return flags.profileId === undefined && flags.sessionId === undefined;
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(ChangeSessionProfile);
      if (ChangeSessionProfile.areFlagsNotDefined(flags)) {
        const selectedSession = await this.selectSession();
        const selectedProfile = await this.selectProfile(selectedSession);
        await this.changeSessionProfile(selectedSession, selectedProfile);
      } else {
        if (this.validateFlags(flags)) {
          const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(flags.sessionId || "");
          const selectedProfile = this.cliProviderService.namedProfilesService.getNamedProfiles().find((p) => p.id === flags.profileId);
          if (!selectedSession) {
            throw new Error("No session with id " + flags.sessionId + " found");
          }
          if (!selectedProfile) {
            throw new Error("No profile with id " + flags.profileId + " found");
          }
          await this.changeSessionProfile(selectedSession, flags.profileId || "");
        }
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService
      .getSessions()
      .filter((session) => this.cliProviderService.sessionFactory.getSessionService(session.type) instanceof AwsSessionService);

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

  async selectProfile(session: Session): Promise<string> {
    const currentProfileName = this.cliProviderService.namedProfilesService.getProfileName((session as any).profileId);
    const availableProfiles = this.cliProviderService.namedProfilesService
      .getNamedProfiles()
      .filter((profile) => profile.id !== (session as any).profileId);

    if (availableProfiles.length === 0) {
      throw new Error("no profiles available");
    }

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedProfile",
        message: `current profile is ${currentProfileName}, select a new profile`,
        type: "list",
        choices: availableProfiles.map((profile) => ({ name: profile.name, value: profile.id })),
      },
    ]);
    return answer.selectedProfile;
  }

  async changeSessionProfile(session: Session, newProfileId: string): Promise<void> {
    try {
      await this.cliProviderService.namedProfilesService.changeNamedProfile(session, newProfileId);
      this.log("session profile changed");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }

  private validateFlags(flags: any): boolean {
    if (flags.sessionId === undefined || flags.profileId === undefined) {
      throw new Error("flags --profileId and --sessionId must all be specified");
    }
    if (flags.sessionId === "") {
      throw new Error("Session Id must not be empty");
    }
    if (flags.profileId === "") {
      throw new Error("Profile Id must not be empty");
    }
    return true;
  }
}
