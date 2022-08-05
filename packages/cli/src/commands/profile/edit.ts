import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws/aws-named-profile";
import { profileId, profileName } from "../../flags";

export default class EditNamedProfile extends LeappCommand {
  static description = "Rename an AWS named profile";

  static examples = [`$leapp profile edit`, `$leapp profile edit --profileId ID --profileName PROFILENAME`];

  static flags = {
    profileId,
    profileName,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(EditNamedProfile);
      if (LeappCommand.areFlagsNotDefined(flags, this)) {
        const selectedNamedProfile = await this.selectNamedProfile();
        const newProfileName = await this.getProfileName();
        await this.editNamedProfile(selectedNamedProfile.id, newProfileName);
      } else {
        await this.editNamedProfileByFlags(flags);
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
        validate: (profileNameString) => this.cliProviderService.namedProfilesService.validateNewProfileName(profileNameString),
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

  private async editNamedProfileByFlags(flags: any) {
    if (this.validateFlags(flags)) {
      const namedProfile = this.cliProviderService.namedProfilesService.getNamedProfiles()?.find((np) => np.id === flags.profileId);
      if (namedProfile) {
        const validation = this.cliProviderService.namedProfilesService.validateNewProfileName(flags.profileName);
        if (validation) {
          await this.editNamedProfile(flags.profileId, flags.profileName);
        } else {
          throw new Error(validation.toString());
        }
      } else {
        throw new Error(`Named profile with Id ${flags.profileId} not found`);
      }
    }
  }

  private validateFlags(flags: any): boolean {
    if (flags.profileId === undefined || flags.profileName === undefined) {
      throw new Error("flags --profileId and --profileName must all be specified");
    }
    if (flags.profileId === "") {
      throw new Error("profileId must not be empty");
    }
    if (flags.profileName === "") {
      throw new Error("profileName must not be empty");
    }
    return true;
  }
}
