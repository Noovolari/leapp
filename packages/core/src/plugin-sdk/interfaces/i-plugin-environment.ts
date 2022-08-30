import { PluginLogLevel } from "../plugin-log-level";
import { SessionData } from "./session-data";
import { Session } from "../../models/session";

export interface IPluginEnvironment {
  log(message: string, level: PluginLogLevel, display: boolean): void;

  fetch(url: string): Promise<any>;

  openExternalUrl(loginUrl: string): void;

  createSession(createSessionRequest: SessionData): Promise<string>;

  cloneSession(session: Session): Promise<string>;

  updateSession(createSessionRequest: SessionData, session: Session): Promise<void>;

  openTerminal(command: string, env?: any): Promise<void>;

  getProfileIdByName(profileName: string): Promise<string>;
}
