import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";
import { constants } from "@noovolari/leapp-core/models/constants";

export default class StartSsmSession extends LeappCommand {
  static description = "Start an AWS SSM session";

  static examples = [`$leapp session start-ssm-session`];

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const selectedSession = await this.selectSession();
      const credentials = await this.generateCredentials(selectedSession);
      const selectedRegion = await this.selectRegion(selectedSession);
      const selectedSsmInstanceId = await this.selectSsmInstance(credentials, selectedRegion);
      await this.startSsmSession(credentials, selectedSsmInstanceId, selectedRegion);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.repository
      .getSessions()
      .filter((session: Session) => this.cliProviderService.sessionFactory.getSessionService(session.type) instanceof AwsSessionService);
    if (availableSessions.length === 0) {
      throw new Error("no sessions available");
    }
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: availableSessions.map((session: any) => ({ name: session.sessionName, value: session })),
      },
    ]);
    return answer.selectedSession;
  }

  async generateCredentials(session: Session): Promise<CredentialsInfo> {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    return await sessionService.generateCredentials(session.sessionId);
  }

  async selectRegion(session: Session): Promise<string> {
    // TODO: check if is possible to filter out unavailable regions
    const availableRegions = this.cliProviderService.cloudProviderService.availableRegions(session.type);

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedRegion",
        message: `select region`,
        type: "list",
        choices: availableRegions.map((region) => ({ name: region.fieldName, value: region.fieldValue })),
      },
    ]);
    return answer.selectedRegion;
  }

  async selectSsmInstance(credentials: CredentialsInfo, region: string): Promise<string> {
    const availableInstances = await this.cliProviderService.ssmService.getSsmInstances(credentials, region);
    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedInstance",
        message: "select an instance",
        type: "list",
        choices: availableInstances.map((instance: any) => ({ name: instance.Name, value: instance.InstanceId })),
      },
    ]);
    return answer.selectedInstance;
  }

  async startSsmSession(credentials: CredentialsInfo, ssmInstanceId: string, region: string): Promise<void> {
    let macOsTerminalType;
    const process = this.cliProviderService.cliNativeService.process;
    if (process.platform === "darwin") {
      const terminalProgram = process.env["TERM_PROGRAM"];
      macOsTerminalType = terminalProgram && terminalProgram.toLowerCase().includes("iterm") ? constants.macOsIterm2 : constants.macOsTerminal;
    }
    await this.cliProviderService.ssmService.startSession(credentials, ssmInstanceId, region, macOsTerminalType);
    this.log("started AWS SSM session");
  }
}
