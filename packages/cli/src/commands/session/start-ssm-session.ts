import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";
import { constants } from "@noovolari/leapp-core/models/constants";
import { region, sessionId, ssmInstanceId } from "../../flags";

export default class StartSsmSession extends LeappCommand {
  static description = "Start an AWS SSM session";

  static examples = [
    `$leapp session start-ssm-session`,
    `$leapp session start-ssm-session --sessionId SESSIONID --region AWSREGION --ssmInstanceId EC2INSTANCEID`,
  ];

  static flags = {
    sessionId,
    region,
    ssmInstanceId,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(StartSsmSession);
      if (LeappCommand.areFlagsNotDefined(flags, this)) {
        const selectedSession = await this.selectSession();
        const credentials = await this.generateCredentials(selectedSession);
        const selectedRegion = await this.selectRegion(selectedSession);
        const selectedSsmInstanceId = await this.selectSsmInstance(credentials, selectedRegion);
        await this.startSsmSession(credentials, selectedSsmInstanceId, selectedRegion);
      } else {
        this.validateFlags(flags);
        const selectedSession = this.cliProviderService.sessionManagementService.getSessionById(`${flags.sessionId}`);
        if (!selectedSession) {
          throw new Error("No session found with id " + flags.sessionId);
        }
        this.unsupportedAzureSession(selectedSession);
        const credentials = await this.generateCredentials(selectedSession);
        const aRegions = this.availableRegions(selectedSession);
        const selectedRegion = aRegions.find((r) => r.fieldName === flags.region);
        if (!selectedRegion) {
          throw new Error("No region found with name " + flags.region);
        }
        await this.startSsmSession(credentials, `${flags.ssmInstanceId}`, `${flags.region}`);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async selectSession(): Promise<Session> {
    const availableSessions = this.cliProviderService.sessionManagementService
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
    const availableRegions = this.availableRegions(session);

    const answer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedRegion",
        message: `select region`,
        type: "list",
        choices: availableRegions.map((r) => ({ name: r.fieldName, value: r.fieldValue })),
      },
    ]);
    return answer.selectedRegion;
  }

  async selectSsmInstance(credentials: CredentialsInfo, r: string): Promise<string> {
    const availableInstances = await this.cliProviderService.ssmService.getSsmInstances(credentials, r);
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

  async startSsmSession(credentials: CredentialsInfo, ssmInstanceIdString: string, r: string): Promise<void> {
    let macOsTerminalType;
    const process = this.cliProviderService.cliNativeService.process;
    if (process.platform === "darwin") {
      const terminalProgram = process.env["TERM_PROGRAM"];
      macOsTerminalType =
        terminalProgram && terminalProgram.toLowerCase().includes("iterm")
          ? constants.macOsIterm2
          : terminalProgram.toLowerCase().includes("warp")
          ? constants.macOsWarp
          : constants.macOsTerminal;
    }
    await this.cliProviderService.ssmService.startSession(credentials, ssmInstanceIdString, r, macOsTerminalType);
    this.log("started AWS SSM session");
  }

  private validateFlags(flags: any) {
    if (!flags.sessionId || !flags.ssmInstanceId || !flags.region) {
      throw new Error("flags --sessionId, --ssmInstanceId and --region must be specified");
    }
    if (flags.sessionId === "") {
      throw new Error("Session ID must not be empty");
    }
    if (flags.ssmInstanceId === "") {
      throw new Error("SSM Instance ID must not be empty");
    }
    if (flags.region === "") {
      throw new Error("Region must not be empty");
    }
    if (
      this.cliProviderService.awsCoreService
        .getRegions()
        .map((r: { region: any }) => r.region)
        .indexOf(flags.region) < 0
    ) {
      throw new Error("Provided region is not a valid AWS region");
    }
  }

  private availableRegions(selectedSession: Session) {
    return this.cliProviderService.cloudProviderService.availableRegions(selectedSession.type);
  }
}
