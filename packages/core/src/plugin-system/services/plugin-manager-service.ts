import * as fs from "fs";
import path from "path";
import { IPlugin } from "../interfaces/IPlugin";

export class PluginManagerService {
  private _plugins: IPlugin[];
  private _requireModule;

  constructor() {
    this._plugins = [];
    this._requireModule = require("require-module");
  }

  get plugins(): IPlugin[] {
    return this._plugins;
  }

  loadFromPluginDir(pluginDir = "plugins") {
    const pluginFilePaths = fs.readdirSync(pluginDir);
    console.log(pluginFilePaths);

    for (let i = 0; i < pluginFilePaths.length; i++) {
      const pluginFilePath = pluginFilePaths[i];
      const pluginModule = this._requireModule(path.join(__dirname, `../${pluginDir}/${pluginFilePath}`));
      console.log(pluginModule);
      const plugin = new pluginModule.MyPlugin();
      this._plugins.push(plugin);
    }
  }

  unloadAllPlugins() {
    this._plugins = [];
  }

  unloadSinglePlugin(name: string) {
    this._plugins.splice(this._plugins.map((p) => p.name).indexOf(name), 1);
  }
}
