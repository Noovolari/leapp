import { LoggedEntry, LogLevel } from "../services/log-service";
import { INativeService } from "../interfaces/i-native-service";
import { IOpenExternalUrlService } from "../interfaces/i-open-external-url-service";

export enum EnvironmentType {
  desktopApp = "desktop-app",
  cli = "cli",
}

export enum PluginLogLevel {
  success,
  info,
  warn,
  error,
}

export class PluginEnvironment {
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
}
