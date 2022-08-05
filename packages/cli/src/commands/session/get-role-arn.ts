import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";

export default class GetRoleArn extends LeappCommand {
  static description = "Get session assumed role ARN";

  static examples = [`$leapp session get-role-arn`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      const roleArn = this.getRoleArn(selectedSession);
      this.log(roleArn);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  getRoleArn(session: Session): string {
    switch (session.type) {
      case SessionType.awsIamRoleChained: {
        return (session as AwsIamRoleChainedSession).roleArn;
      }
      case SessionType.awsIamRoleFederated: {
        return (session as AwsIamRoleFederatedSession).roleArn;
      }
      case SessionType.awsIamUser: {
        //return 'Session type of "AWS IAM User" does not have a role';
        throw new Error('Session type of "AWS IAM User" does not have a role');
      }
      case SessionType.awsSsoRole: {
        return (session as AwsSsoRoleSession).roleArn;
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
