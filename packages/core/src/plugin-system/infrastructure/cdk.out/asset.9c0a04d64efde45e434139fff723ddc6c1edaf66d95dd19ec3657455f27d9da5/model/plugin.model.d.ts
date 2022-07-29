import { StatusModel } from "./status.model";
import { AuthorModel } from "./author.model";
export interface PluginModel {
    pluginName: string;
    author: AuthorModel;
    description: string;
    uri?: string;
    signature?: string;
    hash?: string;
    status?: StatusModel;
}
