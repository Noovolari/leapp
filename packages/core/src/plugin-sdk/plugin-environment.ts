import { LoggedEntry, LogLevel } from "../services/log-service";
import { INativeService } from "../interfaces/i-native-service";
import { IOpenExternalUrlService } from "../interfaces/i-open-external-url-service";
import { AwsSessionService } from "../services/session/aws/aws-session-service";
import { Session } from "../models/session";
import { CredentialsInfo } from "../models/credentials-info";
import { IPluginEnvironment } from "./interfaces/i-plugin-environment";
import { PluginLogLevel } from "./plugin-log-level";
import { SessionData } from "./interfaces/session-data";

export enum EnvironmentType {
  desktopApp = "desktop-app",
  cli = "cli",
}

export class PluginEnvironment implements IPluginEnvironment {
  private nativeService: INativeService;
  private openExternalUrlService: IOpenExternalUrlService;

  constructor(private readonly environmentType: EnvironmentType, private readonly providerService: any) {
    if (environmentType === EnvironmentType.desktopApp) {
      this.nativeService = providerService.appNativeService;
      this.openExternalUrlService = providerService.windowService;
    } else {
      this.nativeService = providerService.cliNativeService;
      this.openExternalUrlService = providerService.cliOpenWebConsoleService;
    }
  }

  log(message: string, level: PluginLogLevel, display: boolean): void {
    this.providerService.logService.log(new LoggedEntry(message, this, level as unknown as LogLevel, display));
  }

  fetch(url: string): any {
    return this.nativeService.fetch(url);
  }

  openExternalUrl(loginUrl: string): void {
    this.openExternalUrlService.openExternalUrl(loginUrl);
  }

  async createSession(createSessionData: SessionData): Promise<string> {
    const sessionService = this.providerService.sessionFactory.getSessionService(createSessionData.sessionType);
    return await sessionService.create(createSessionData.getCreationRequest());
  }

  async cloneSession(session: Session): Promise<string> {
    console.log("SESSION:");
    console.log(session);
    const sessionService = this.providerService.sessionFactory.getSessionService(session.type);
    const createSessionData = await sessionService.getCloneRequest(session);
    console.log("CREATE SESSION DATA");
    console.log(createSessionData);
    return await sessionService.create(createSessionData);
  }

  async updateSession(updateSessionData: SessionData, session: Session): Promise<void> {
    const sessionService = this.providerService.sessionFactory.getSessionService(session.type);
    return await sessionService.update(session.sessionId, updateSessionData.getCreationRequest());
  }

  async openTerminal(command: string, env?: any): Promise<void> {
    this.providerService.executeService.openTerminal(command, env);
  }

  private async generateCredentials(session: Session): Promise<CredentialsInfo> {
    const sessionService = this.providerService.sessionFactory.getSessionService(session.type) as unknown as AwsSessionService;
    return await sessionService.generateCredentials(session.sessionId);
  }
}
