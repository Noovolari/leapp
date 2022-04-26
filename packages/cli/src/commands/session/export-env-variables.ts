import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws-named-profile";
import { constants } from "@noovolari/leapp-core/models/constants";
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { Flags } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { LeappCommand } from "../../leapp-command";

interface EnvVariable {
  name: string;
  value: string;
}

export default class ExportEnvVariablesSession extends LeappCommand {
  static description = "Provides info about the current active session for a selected profile (if no profile is provided it uses default profile)";
  static examples = ['$leapp session current --format "alias accountNumber" --inline --provider aws'];
  static flags = {
    profile: Flags.string({
      char: "p",
      description: "aws named profile of which exports environment variables",
      default: constants.defaultAwsProfileName,
      required: false,
    }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(ExportEnvVariablesSession);
      const selectedSession = this.getSessionFromProfile(flags.profile);
      const credentialVariables = await this.generateCredentialVariables(selectedSession);
      this.printSetVariablesCommand(credentialVariables);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async generateCredentialVariables(session: Session): Promise<EnvVariable[]> {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
    let envVariables;
    if (sessionService instanceof AwsSessionService) {
      const sessionCredentials = await sessionService.generateCredentials(session.sessionId);
      envVariables = [
        { name: "AWS_ACCESS_KEY_ID", value: sessionCredentials.sessionToken.aws_access_key_id },
        { name: "AWS_SECRET_ACCESS_KEY", value: sessionCredentials.sessionToken.aws_secret_access_key },
        { name: "AWS_SESSION_TOKEN", value: sessionCredentials.sessionToken.aws_session_token },
        { name: "AWS_REGION", value: session.region },
      ];
    } else {
      throw new Error(`session type not supported: ${session.type}`);
    }
    return envVariables;
  }

  printSetVariablesCommand(envVariables: EnvVariable[]) {
    const process = this.cliProviderService.cliNativeService.process;
    if (process.platform === "win32") {
      this.log(envVariables.map((envVariable) => `SET "${envVariable.name}=${envVariable.value}"`).join(" & "));
    } else {
      this.log(envVariables.map((envVariable) => `export ${envVariable.name}='${envVariable.value}'`).join("; "));
    }
  }

  getSessionFromProfile(profileName: string): Session {
    const profileId = this.getProfileId(profileName);
    const sessions = this.cliProviderService.repository.listActive().filter((session: Session) => (session as any).profileId === profileId);
    if (sessions.length === 0) {
      throw new Error(`no active aws session available for "${profileName}" named profile`);
    }
    return sessions[0];
  }

  getProfileId(profileName: string): string {
    const profiles = this.cliProviderService.repository.getProfiles().filter((profile: AwsNamedProfile) => profile.name === profileName);
    if (profiles.length === 0) {
      throw new Error(`AWS named profile "${profileName}" not found`);
    } else if (profiles.length > 1) {
      throw new Error("selected profile has more than one occurrence");
    }
    return profiles[0].id;
  }
}
