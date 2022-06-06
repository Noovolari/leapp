import { AwsNamedProfile } from "@noovolari/leapp-core/models/aws-named-profile";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { Flags } from "@oclif/core";
import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { Session } from "@noovolari/leapp-core/models/session";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AzureService } from "@noovolari/leapp-core/services/session/azure/azure-service";
import { AzureSession } from "@noovolari/leapp-core/models/azure/azure-session";

const awsProvider = "aws";
const azureProvider = "azure";

export default class CurrentSession extends LeappCommand {
  static description = "Provides info about the current active session for a selected profile (if no profile is provided it uses default profile)";
  static examples = ['$leapp session current --format "alias accountNumber" --inline --provider aws'];
  static flags = {
    inline: Flags.boolean({
      char: "i",
      default: false,
    }),
    profile: Flags.string({
      char: "p",
      description: "aws named profile of which gets info",
      default: constants.defaultAwsProfileName,
      required: false,
    }),
    provider: Flags.string({
      char: "r",
      description: "filters sessions by the cloud provider service",
      default: undefined,
      required: false,
      options: [awsProvider, azureProvider],
    }),
    format: Flags.string({
      char: "f",
      description: "allows formatting data to show \n\t- aws -> id alias, accountNumber, roleArn\n\t- azure -> id tenantId, subscriptionId",
      default: undefined,
      required: false,
    }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(CurrentSession);
      const dataFormat = flags.inline ? "inline" : "JSON";
      const dataFilter = flags.format ? this.getFieldsRequired(flags.format) : undefined;
      const selectedSession = await this.getSessionFromProfile(flags.profile, flags.provider);
      await this.currentSession(selectedSession, dataFormat, dataFilter);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async currentSession(session: Session, dataFormat: string, dataFilter?: string[]): Promise<void> {
    const currentSessionData = this.formatSessionData(this.filterSessionData(await this.getSessionData(session), dataFilter), dataFormat);
    this.log(currentSessionData?.trim());
  }

  getSessionFromProfile(profileName: string, provider: string | undefined): Session {
    const profileId =
      profileName === constants.defaultAwsProfileName
        ? this.cliProviderService.workspaceService.getDefaultProfileId()
        : this.getProfileId(profileName);
    let sessions = this.cliProviderService.sessionManagementService.getActiveSessions().filter((session: Session) => {
      const anySession = session as any;
      return anySession.profileId === undefined || anySession.profileId === profileId;
    });
    if (provider) {
      sessions = sessions.filter((session: Session) => this.getProviderAssociatedSessionTypes(provider).includes(session.type));
    }
    if (sessions.length === 0) {
      throw new Error("no active sessions available for the specified criteria");
    } else if (sessions.length > 1) {
      throw new Error("multiple active sessions found, please specify a provider with --provider");
    }
    return sessions[0];
  }

  getProfileId(profileName: string): string {
    const profiles = this.cliProviderService.namedProfilesService
      .getNamedProfiles()
      .filter((profile: AwsNamedProfile) => profile.name === profileName);
    if (profiles.length === 0) {
      throw new Error(`AWS named profile "${profileName}" not found`);
    } else if (profiles.length > 1) {
      throw new Error("selected profile has more than one occurrence");
    }
    return profiles[0].id;
  }

  getFieldsRequired(filters: string): string[] {
    return filters.split(" ").filter((token) => token.trim() !== "");
  }

  async getSessionData(session: Session): Promise<any> {
    const sessionService = this.cliProviderService.sessionFactory.getSessionService(session.type);
    if (sessionService instanceof AwsSessionService) {
      return {
        id: session.sessionId,
        alias: session.sessionName,
        accountNumber: await sessionService.getAccountNumberFromCallerIdentity(session),
        roleArn: session.type === SessionType.awsIamUser ? "none" : (session as any).roleArn,
      };
    } else if (sessionService instanceof AzureService) {
      const azureSession = session as AzureSession;
      return {
        id: azureSession.sessionId,
        alias: azureSession.sessionName,
        tenantId: azureSession.tenantId,
        subscriptionId: azureSession.subscriptionId,
      };
    } else {
      throw new Error(`session type not supported: ${session.type}`);
    }
  }

  filterSessionData(sessionData: any, filterArray?: string[]): any {
    const filteredData = Object.assign({}, sessionData) as any;
    if (filterArray) {
      for (const key in sessionData) {
        if (Object.prototype.hasOwnProperty.call(sessionData, key)) {
          if (!filterArray.includes(key)) {
            delete filteredData[key];
          }
        }
      }
    }

    return filteredData;
  }

  formatSessionData(sessionData: any, dataFormat: string): any {
    let dataFormatted = "";
    const lastKey = Object.keys(sessionData)[Object.entries(sessionData).length - 1];
    if (dataFormat === "inline") {
      for (const key in sessionData) {
        if (Object.prototype.hasOwnProperty.call(sessionData, key)) {
          dataFormatted += `${key}: ${sessionData[key]}${key === lastKey ? "" : ", "}`;
        }
      }
      return dataFormatted;
    } else if (dataFormat === "JSON") {
      return JSON.stringify(sessionData);
    } else {
      throw new Error(`formatting style not allowed "${dataFormat}"`);
    }
  }

  getProviderAssociatedSessionTypes(provider: string): SessionType[] {
    const providerSessions: any = {
      [awsProvider]: [SessionType.awsIamUser, SessionType.awsIamRoleChained, SessionType.awsIamRoleFederated, SessionType.awsSsoRole],
      [azureProvider]: [SessionType.azure],
    };

    return providerSessions[provider];
  }
}
