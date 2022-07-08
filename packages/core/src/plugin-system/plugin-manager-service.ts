import { IPlugin } from "./interfaces/IPlugin";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "../services/log-service";

export class PluginManagerService {
  private _plugins: IPlugin[];
  private _requireModule;
  private _hashElement;
  private _pluginDir = "plugins";

  constructor(private nativeService: INativeService, private logService: LogService) {
    this._plugins = [];
    this._requireModule = nativeService.requireModule;
    this._hashElement = nativeService.hashElement.hashElement;
  }

  private static base64Decoding(input) {
    return Buffer.from(input, "base64");
  }

  get plugins(): IPlugin[] {
    return this._plugins;
  }

  verifyAndGeneratePluginFolderIfMissing() {
    if (!this.nativeService.fs.existsSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir)) {
      this.nativeService.fs.mkdirSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir);
    }
  }

  async loadFromPluginDir() {
    const options = {
      folders: { include: ["*.*"] },
      files: { exclude: ["signature", ".DS_Store"] },
    };

    const pluginFilePaths = this.nativeService.fs.readdirSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir);
    console.log(pluginFilePaths);

    for (let i = 0; i < pluginFilePaths.length; i++) {
      let pluginFilePath = pluginFilePaths[i];
      pluginFilePath = this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir + "/" + pluginFilePath;

      const isDir = this.nativeService.fs.existsSync(pluginFilePath) && this.nativeService.fs.lstatSync(pluginFilePath).isDirectory();
      if (isDir) {
        console.log(pluginFilePath);
        console.log("Creating a hash over the current folder");
        this.logService.log(new LoggedEntry("Creating a hash over the current folder", this, LogLevel.info, false));

        let hash;
        try {
          // Hashing file and directory
          hash = await this._hashElement(pluginFilePath, options);
          if (hash.children) {
            // If it has children then it is a directory
            console.log(hash);
          }
        } catch (error) {
          console.error("hashing failed:", error);
          this.logService.log(new LoggedException(`hashing failed: ${error.toString()}`, this, LogLevel.warn, false));
        }

        try {
          if (this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")) {
            const pluginModule = this._requireModule(pluginFilePath + "/plugin.js");
            console.log(pluginModule);
            this.logService.log(new LoggedEntry(`loading plugin: ${JSON.stringify(pluginModule)}`, this, LogLevel.info, false));

            const plugin = new pluginModule.MyPlugin();
            this._plugins.push(plugin);
          }
        } catch (error) {
          console.log("error loading plugin: " + error);
          this.logService.log(new LoggedException(`error loading plugin: ${JSON.stringify(error)}`, this, LogLevel.error, false));
        }
      }
    }
  }

  unloadAllPlugins() {
    this._plugins = [];
  }

  unloadSinglePlugin(name: string) {
    this._plugins.splice(this._plugins.map((p) => p.name).indexOf(name), 1);
  }

  private rsaVerifySignatureFromBase64(publicKey, message, signatureBase64) {
    const signature = PluginManagerService.base64Decoding(signatureBase64);
    const verifier = this.nativeService.crypto.createVerify("sha256");
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKey, signature);
  }
}
