import { PluginLogLevel } from "../plugin-log-level";
import { SessionData } from "./session-data";

export interface IPluginEnvironment {
  log(message: string, level: PluginLogLevel, display: boolean): void;

  fetch(url: string): Promise<any>;

  openExternalUrl(loginUrl: string): void;

  createSession(createSessionRequest: SessionData): Promise<string>;

  cloneSession(sessionId: string): Promise<string>;

  updateSession(createSessionRequest: SessionData, sessionId: string): Promise<void>;

  openTerminal(command: string, env?: any): Promise<void>;
}
