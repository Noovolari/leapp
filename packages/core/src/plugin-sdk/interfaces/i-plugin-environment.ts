import { PluginLogLevel } from "../plugin-log-level";

export interface IPluginEnvironment {
  log(message: string, level: PluginLogLevel, display: boolean): void;

  fetch(url: string): any;

  openExternalUrl(loginUrl: string): void;
}
