import { Session } from "../../models/session";
import { PluginCoreService } from "../plugin-core-service";

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

export interface IPlugin {
  name: string;
  description: string;
  author: string;
  url: string;
  tags: string[];
  supportedOS: string[];
  active: boolean;

  templateStructure: {
    form: IPluginFormObject[];
    output: IPluginOutputObject;
  };

  boostrap: (session: Session, pluginCoreService: PluginCoreService) => any;

  applyAction: () => any;
}
