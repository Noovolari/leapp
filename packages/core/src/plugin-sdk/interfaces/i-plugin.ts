import { Session } from "../../models/session";
import { SessionType } from "../../models/session-type";
import { OperatingSystem } from "../../models/operating-system";

export enum TemplateFormObject {
  inputText,
  inputUrl,
  inputPassword,
  button,
  submit,
  cancel,
}

export enum TemplateOutputObject {
  log,
  message,
  html,
  terminal,
}

export interface IPluginFormObject {
  type: TemplateFormObject;
  label: string;
  action: any;
}

export interface IPluginOutputObject {
  type: TemplateOutputObject;
  data: string;
}

/**
 * This interface represents the metadata associated with the plugin. This information is extracted from the plugin package.json.
 *
 * @property {string} version - the SemVer version of the plugin
 * @property {string} uniqueName - the plugin name
 * @property {string} description - the plugin description
 * @property {string} author - the author of the plugin
 * @property {string} url
 * @property {string[]} keywords - npm package keywords. leapp-plugin keyword is required to allow the plugin to be listed in the {@link https://www.leapp.cloud/plugins|Plugin Hub}
 */
export interface IPluginMetadata {
  version: string;
  uniqueName: string;
  description: string;
  author: string;
  url: string;
  keywords: string[];
  active: boolean;
  icon: string;
  supportedOS: OperatingSystem[];
  supportedSessions?: SessionType[];
}

/**
 * This interface represents a generic Leapp plugin. It can be implemented to
 * create custom plugins.
 *
 * @property {string} pluginType - the type associated with the concrete plugin that implements the IPlugin interface
 * @property {IPluginMetadata} metadata - the plugin metadata
 * @property {(session: Session) => Promise<void>} run - the method in which the plugin logic is implemented.
 * It should be implemented by the concrete plugin. It is invoked by the Desktop App.
 */
export interface IPlugin {
  readonly pluginType: string;
  readonly metadata: IPluginMetadata;
  run: (session: Session) => Promise<void>;
}
