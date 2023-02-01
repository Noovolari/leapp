import { PluginLogLevel } from "../plugin-log-level";
import { SessionData } from "./session-data";
import { Session } from "../../models/session";

/**
 * This interface includes all the methods that can be used from the IPlugin run method implementation to implement the plugin logic.
 *
 * @see IPluginEnvironment
 * @see IPlugin
 */
export interface IPluginEnvironment {
  /**
   * This method can be used to log the given message with a specific PluginLogLevel. It is possible to set the display
   * param to true if the concrete implementation provides a way to show the message to the end user.
   * In any case, it logs the message in the log file.
   *
   * @param {string} message - the message to log
   * @param {PluginLogLevel} level - the severity of the log message
   * @param {boolean} display - this param is used to specify whether the message must be displayed to the end user or not
   * @see PluginLogLevel
   */
  log(message: string, level: PluginLogLevel, display: boolean): void;

  /**
   * This method performs an HTTP(S) fetch
   *
   * @param {string} url - the URL the HTTP(S) fetch has to be forwarded to
   */
  fetch(url: string): Promise<any>;

  /**
   * Open an external URL in the default browser.
   *
   * @param {string} loginUrl - a valid HTTP URL to open in the default browser
   */
  openExternalUrl(loginUrl: string): void;

  /**
   * Create a new Leapp Session from the createSessionData parameter. The type of its argument is SessionData.
   * In particular, SessionData is an abstract class that contains Leapp Session metadata.
   * You have to pass a concrete implementation of the SessionData abstract clas to createSession.
   * Available concrete implementations are:
   *
   * - AwsIamUserSessionData;
   * - AwsIamRoleFederatedSessionData;
   * - AwsIamRoleChainedSessionData.
   *
   * @param {SessionData} createSessionRequest - the metadata used to create the Leapp Session
   * @see AwsIamUserSession
   * @see AwsIamRoleFederatedSession
   * @see AwsIamRoleChainedSession
   * @see AwsIamRoleChainedSessionData
   * @see AwsIamRoleFederatedSessionData
   * @see AwsIamUserSessionData
   */
  createSession(createSessionRequest: SessionData): Promise<string>;

  /**
   * This method allows you to clone the given Leapp Session.
   * This operation is allowed for the following Leapp Session types:
   *
   * - AwsIamUserSession;
   * - AwsIamRoleFederatedSession;
   * - AwsIamRoleChainedSession.
   *
   * @param {Session} session - the Leapp Session to clone
   * @see Session
   * @see AwsIamUserSession
   * @see AwsIamRoleFederatedSession
   * @see AwsIamRoleChainedSession
   */
  cloneSession(session: Session): Promise<string>;

  /**
   * This method allows you to update the given session with the given updateSessionData.
   * This operation is allowed for the following Leapp Session types:
   *
   * - AwsIamUserSession;
   * - AwsIamRoleFederatedSession;
   * - AwsIamRoleChainedSession.
   *
   * @param {SessionData} createSessionRequest - the metadata used to update the given Leapp Session
   * @param {Session} session - the Leapp Session that I want to update
   * @see SessionData
   * @see Session
   * @see AwsIamUserSession
   * @see AwsIamRoleFederatedSession
   * @see AwsIamRoleChainedSession
   */
  updateSession(createSessionRequest: SessionData, session: Session): Promise<void>;

  /**
   * Execute the given command in the platform-specific terminal; optionally, it is possible to set an env key/value object containing
   * the env variables to export in the terminal, before the command execution.
   * The terminal window base path is set to the home directory.
   *
   * @param {string} command - the command that I want to execute in the platform-specific terminal
   * @param {any} env - optional key/value env variables object
   */
  openTerminal(command: string, env?: any): Promise<void>;

  /**
   * Return the ID of a NamedProfile from the given name if it exists, otherwise creates a new named profile and returns its ID.
   * Can be used when creating/editing a session since SessionData requires the ID of a named profile.
   *
   * @param {string} profileName - the name of the NamedProfile I want to retrieve
   */
  getProfileIdByName(profileName: string): string;

  /**
   * Return the ID of the IdpUrl object from the given URL if it exists, otherwise creates a new IdP URL and returns its ID.
   * Can be used when creating/editing Federated Sessions since SessionData requires the ID of an IdP URL.
   *
   * @param {string} idpUrl - the URL associated with the IdpUrl I want to retrieve
   */
  getIdpUrlIdByUrl(idpUrl: string): string;
}
