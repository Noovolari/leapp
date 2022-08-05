import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";

export default class GetAccountNumber extends LeappCommand {
  static description = "Get session account number";

  static examples = [`$leapp session get-account-number`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      const accountNumber = await this.getAccountNumber(selectedSession);
      this.log(accountNumber);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  getAccountNumber(session: Session): Promise<string> {
    switch (session.type) {
      case SessionType.awsIamRoleChained: {
        return this.cliProviderService.awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleChainedSession);
      }
      case SessionType.awsIamRoleFederated: {
        return this.cliProviderService.awsIamRoleFederatedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleFederatedSession);
      }
      case SessionType.awsIamUser: {
        return this.cliProviderService.awsIamUserService.getAccountNumberFromCallerIdentity(session);
      }
      case SessionType.awsSsoRole: {
        return this.cliProviderService.awsSsoRoleService.getAccountNumberFromCallerIdentity(session as AwsSsoRoleSession);
      }
      default: {
        throw new Error(`Unknown session.type: ${session.type}`);
      }
    }
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
