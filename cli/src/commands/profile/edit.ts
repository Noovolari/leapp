import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws-named-profile";

export default class EditNamedProfile extends LeappCommand {
  static description = "Rename an AWS named profile";

  static examples = [`$leapp profile edit`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedNamedProfile = await this.selectNamedProfile();
      const newProfileName = await this.getProfileName();
      await this.editNamedProfile(selectedNamedProfile.id, newProfileName);
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
        message: `select a profile`,
        type: "list",
        choices: namedProfiles.map((profile) => ({ name: profile.name, value: profile })),
      },
    ]);
    return answer.selectedNamedProfile;
  }

  async getProfileName(): Promise<string> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "namedProfileName",
        message: `choose a new name for the profile`,
        validate: (profileName) => this.cliProviderService.namedProfilesService.validateNewProfileName(profileName),
        type: "input",
      },
    ]);
    return answer.namedProfileName;
  }

  async editNamedProfile(id: string, newName: string): Promise<void> {
    try {
      await this.cliProviderService.namedProfilesService.editNamedProfile(id, newName);
      this.log("profile edited");
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }
}
