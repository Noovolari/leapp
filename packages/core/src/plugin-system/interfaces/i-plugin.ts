import { Session } from "../../models/session";
import { SessionType } from "../../models/session-type";
import { PluginCoreService } from "../plugin-core-service";
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

export interface IPluginMetadata {
  version: string;
  uniqueName: string;
  description: string;
  author: string;
  url: string;
  keywords: string[];
  active: boolean;
  supportedOS: OperatingSystem[];
  supportedSessions?: SessionType[];
}

export interface IPlugin {
  readonly metadata: IPluginMetadata;

  templateStructure: {
    form: IPluginFormObject[];
    output: IPluginOutputObject;
  };

  boostrap: (session: Session, pluginCoreService: PluginCoreService) => any;

  applyAction: () => any;
}
