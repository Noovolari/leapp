import {AuthorModel} from "./author.model";
import {StatusModel} from "./status.model";

export interface PluginModel {
  id: string;
  pluginName: string;
  author: AuthorModel;
  description: string;
  tags?: string;
  uri: string;
  signature?: string;
  hash?: string;
  status: StatusModel;
  createdAt: string;
  updatedAt: string;
}
