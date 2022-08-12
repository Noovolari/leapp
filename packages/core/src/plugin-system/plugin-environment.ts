import { LogLevel } from "../services/log-service";

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
  constructor(private readonly environmentType: EnvironmentType, private readonly providerService: any) {}

  log(message: string, level: PluginLogLevel): void {
    this.providerService.logService.log(message, level as unknown as LogLevel);
  }

  fetch(url: string): any {
    return this.providerService.appNativeService.fetch(url);
  }

  openExternalUrl(loginUrl: string): void {
    this.providerService.windowService.openExternalUrl(loginUrl);
  }
}
