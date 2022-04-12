import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws-named-profile";
import { Session } from "@noovolari/leapp-core/models/session";
import { profileId, force } from "../../flags";

export default class DeleteNamedProfile extends LeappCommand {
  static description = "Delete an AWS named profile";

  static examples = [`$leapp profile delete`];

  static flags = {
    profileId,
    force,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(DeleteNamedProfile);
      if (flags.profileId && flags.profileId !== "") {
        const affectedSessions = this.getAffectedSessions(flags.profileId);
        if (flags.force || (await this.askForConfirmation(affectedSessions))) {
          await this.deleteNamedProfile(flags.profileId);
        }
      } else {
        const selectedNamedProfile = await this.selectNamedProfile();
        const affectedSessions = this.getAffectedSessions(selectedNamedProfile.id);
        if (await this.askForConfirmation(affectedSessions)) {
          await this.deleteNamedProfile(selectedNamedProfile.id);
        }
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectNamedProfile(): Promise<AwsNamedProfile> {
    const namedProfiles = this.cliProviderService.namedProfilesService.getNamedProfiles(true);
    if (namedProfiles.length === 0) {
      throw new Error("no profiles available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedNamedProfile",
        message: `select a profile to delete`,
        type: "list",
        choices: namedProfiles.map((profile) => ({ name: profile.name, value: profile })),
      },
    ]);
    return answer.selectedNamedProfile;
  }

  getAffectedSessions(namedProfileId: string): Session[] {
    return this.cliProviderService.namedProfilesService.getSessionsWithNamedProfile(namedProfileId);
  }

  async askForConfirmation(affectedSessions: Session[]): Promise<boolean> {
    if (affectedSessions.length === 0) {
      return true;
    }
    const sessionsList = affectedSessions.map((session) => `- ${session.sessionName}`).join("\n");
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "confirmation",
        message: `Deleting this profile will set default to these sessions\n${sessionsList}\nDo you want to continue?`,
        type: "confirm",
      },
    ]);
    return answer.confirmation;
  }

  async deleteNamedProfile(id: string): Promise<void> {
    try {
      await this.cliProviderService.namedProfilesService.deleteNamedProfile(id);
      this.log("profile deleted");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }
}
