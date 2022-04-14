import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { profileName } from "../../flags";

export default class CreateNamedProfile extends LeappCommand {
  static description = "Create a new AWS named profile";

  static examples = [`$leapp profile create`, `$leapp profile create --profileName PROFILENAME`];

  static flags = {
    profileName,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(CreateNamedProfile);
      if (flags.profileName && flags.profileName !== "") {
        const validation = this.cliProviderService.namedProfilesService.validateNewProfileName(flags.profileName);
        if (validation === true) {
          await this.createNamedProfile(flags.profileName);
        } else {
          throw new Error(validation.toString());
        }
      } else {
        const profileNameString = await this.getProfileName();
        await this.createNamedProfile(profileNameString);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async getProfileName(): Promise<string> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "namedProfileName",
        message: `choose a name for the profile`,
        validate: (profileNameString) => this.cliProviderService.namedProfilesService.validateNewProfileName(profileNameString),
        type: "input",
      },
    ]);
    return answer.namedProfileName;
  }

  async createNamedProfile(profileNameString: string): Promise<void> {
    this.cliProviderService.namedProfilesService.createNamedProfile(profileNameString);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("profile created");
  }
}
