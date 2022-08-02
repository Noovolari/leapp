import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

export default class GetSessionCredentials extends LeappCommand {
  static description = "Get session credentials as exported environment variables";

  static examples = [`$leapp session get-session-credentials`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      const sessionCredentials = await this.getSessionCredentials(selectedSession);
      this.log(sessionCredentials);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async getSessionCredentials(session: Session): Promise<string> {
    let sessionCredentialsToken;
    let sessionCredentials: string;
    switch (session.type) {
      case SessionType.awsIamRoleChained: {
        sessionCredentialsToken = (await this.cliProviderService.awsIamRoleChainedService.generateCredentials(session.sessionId)).sessionToken;
        break;
      }
      case SessionType.awsIamRoleFederated: {
        sessionCredentialsToken = (await this.cliProviderService.awsIamRoleFederatedService.generateCredentials(session.sessionId)).sessionToken;
        break;
      }
      case SessionType.awsIamUser: {
        sessionCredentialsToken = (await this.cliProviderService.awsIamUserService.generateCredentials(session.sessionId)).sessionToken;
        break;
      }
      case SessionType.awsSsoRole: {
        sessionCredentialsToken = (await this.cliProviderService.awsSsoRoleService.generateCredentials(session.sessionId)).sessionToken;
        break;
      }
      default: {
        throw new Error(`Unknown session.type: ${session.type}`);
      }
    }

    /* eslint-disable no-useless-escape */
    sessionCredentials = `export AWS_REGION=\"${session.region}\"\n`;
    sessionCredentials += `export AWS_ACCESS_KEY_ID=\"${sessionCredentialsToken.aws_access_key_id}\"\n`;
    sessionCredentials += `export AWS_SECRET_ACCESS_KEY=\"${sessionCredentialsToken.aws_secret_access_key}\"\n`;
    sessionCredentials += `export AWS_SESSION_TOKEN=\"${sessionCredentialsToken.aws_session_token}\"\n`;
    /* eslint-enable no-useless-escape */

    return sessionCredentials;
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService.getSessions();
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
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
}
