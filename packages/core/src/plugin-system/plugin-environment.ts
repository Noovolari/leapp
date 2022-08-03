export enum EnvironmentType {
  desktopApp = "desktop-app",
  cli = "cli",
}

export class PluginEnvironment {
  // TODO: providerService should have a common interface
  constructor(public environmentType: EnvironmentType, public providerService: any) {}
}
