export enum EnvironmentType {
  desktopApp = "desktop-app",
  cli = "cli",
}

export class PluginEnvironment {
  constructor(public environmentType: EnvironmentType, public providerService: any) {}
}
