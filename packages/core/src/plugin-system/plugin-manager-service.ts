import { IPlugin, IPluginMetadata } from "./interfaces/i-plugin";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "../services/log-service";
import { constants } from "../models/constants";
import { Repository } from "../services/repository";
import { SessionType } from "../models/session-type";
import { OperatingSystem } from "../models/operating-system";
import { Session } from "../models/session";
import { SessionFactory } from "../services/session-factory";

export class PluginManagerService {
  private _plugins: IPlugin[];
  private _requireModule;
  private _hashElement;
  private _pluginDir = "plugins";

  constructor(
    private nativeService: INativeService,
    private logService: LogService,
    private repository: Repository,
    private sessionFactory: SessionFactory,
    private http: any
  ) {
    this._plugins = [];
    this._requireModule = nativeService.requireModule;
    this._hashElement = nativeService.hashElement.hashElement;
  }

  private static base64Decoding(input): Buffer {
    return Buffer.from(input, "base64");
  }

  get plugins(): IPlugin[] {
    return this._plugins;
  }

  verifyAndGeneratePluginFolderIfMissing(): void {
    if (!this.nativeService.fs.existsSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir)) {
      this.nativeService.fs.mkdirSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir);
    }
  }

  async loadFromPluginDir(): Promise<void> {
    this._plugins = [];
    const options = {
      folders: { include: ["*.*"] },
      files: { exclude: ["signature", ".DS_Store", "package-lock.json"] },
    };

    const pluginFolderNames = this.nativeService.fs.readdirSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir);

    for (let i = 0; i < pluginFolderNames.length; i++) {
      const pluginName = pluginFolderNames[i];
      const pluginFilePath = this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir + "/" + pluginName;

      const isDir = this.nativeService.fs.existsSync(pluginFilePath) && this.nativeService.fs.lstatSync(pluginFilePath).isDirectory();
      if (isDir) {
        console.log(pluginFilePath);
        console.log("Creating a hash over the current folder");

        // VALIDATION PROCESS
        const { packageJson, isPluginValid } = await this.validatePlugin(pluginFilePath, options, pluginFolderNames, i);

        // HANDLE PACKAGE.JSON ERROR
        let metadata: IPluginMetadata;
        try {
          metadata = this.extractMetadata(packageJson);
        } catch (errors) {
          this.logService.log(
            new LoggedEntry(`missing or invalid values in plugin ${pluginName} package.json: ${errors.message}`, this, LogLevel.warn, true)
          );
          continue;
        }

        // CHECK VALIDATION
        const isSignatureInvalid = !isPluginValid && !constants.skipPluginValidation;
        if (isSignatureInvalid) {
          this.logService.log(new LoggedEntry(`Signature not verified for plugin: ${pluginFolderNames[i]}`, this, LogLevel.warn, true));
          this.nativeService.rimraf(pluginFilePath, () => {});
          continue;
        }

        // LOAD
        try {
          if (this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")) {
            const pluginModule = this._requireModule(pluginFilePath + "/plugin.js");
            this.logService.log(new LoggedEntry(`loading plugin: ${JSON.stringify(pluginModule)}`, this, LogLevel.info, false));

            const plugin = new pluginModule[metadata.entryClass]() as any;
            plugin.metadata = metadata;
            if (!this.repository.getPluginStatus(plugin.metadata.uniqueName)) {
              this.repository.createPluginStatus(plugin.metadata.uniqueName);
            }
            this._plugins.push(plugin);
          }
        } catch (error) {
          console.log("error loading plugin: " + error.toString());
          this.logService.log(new LoggedException(`error loading plugin: ${JSON.stringify(error)}`, this, LogLevel.error, false));
        }
      }
    }
  }

  unloadAllPlugins(): void {
    this._plugins = [];
  }

  unloadSinglePlugin(name: string): void {
    this._plugins.splice(this._plugins.map((p) => p.metadata.uniqueName).indexOf(name), 1);
  }

  testRsaSignToBase64(message: string): string {
    const privateKey = "fake-rsa-key";
    const signer = this.nativeService.crypto.createSign("sha256");
    signer.update(message);
    signer.end();
    const signature = signer.sign({
      key: privateKey,
      format: "pem",
      type: "pkcs1",
      passphrase: "fake-passphrase",
    });
    return signature.toString("Base64");
  }

  availablePlugins(os: OperatingSystem, session: Session): IPlugin[] {
    return this._plugins.filter(
      (plugin) =>
        plugin.metadata.active &&
        plugin.metadata.supportedOS.includes(os) &&
        plugin.metadata.supportedSessions.some((supportedSession) => this.sessionFactory.getCompatibleTypes(supportedSession).includes(session.type))
    );
  }

  private extractMetadata(packageJson: any): IPluginMetadata {
    const errors = [];
    const version = packageJson.version;
    if (!version) {
      errors.push("version");
    }
    const uniqueName = packageJson.name;
    if (!uniqueName) {
      errors.push("name");
    }
    const author = packageJson.author?.name ? packageJson.author.name : packageJson.author;
    if (!author) {
      errors.push("author");
    }
    const description = packageJson.description;
    if (!description) {
      errors.push("description");
    }

    const keywords = packageJson.keywords as string[];
    if (!keywords || keywords.length === 0) {
      errors.push("keywords");
    } else if (!keywords.includes(constants.npmRequiredPluginKeyword)) {
      errors.push(`${constants.npmRequiredPluginKeyword} keyword`);
    }

    const leappPluginConfig = packageJson.leappPlugin;
    if (!leappPluginConfig) {
      errors.push("leappPlugin");
    }

    const supportedSessionTypes = leappPluginConfig?.supportedSessions || [SessionType.anytype];
    for (const sessionType of supportedSessionTypes) {
      if (this.sessionFactory.getCompatibleTypes(sessionType).length === 0) {
        errors.push(`leappPlugin.supportedSessions: ${sessionType} is unsupported`);
      }
    }
    const entryClass = leappPluginConfig?.entryClass;
    if (leappPluginConfig && !entryClass) {
      errors.push("leappPlugin.entryClass");
    }

    const icon = leappPluginConfig?.icon || "fas fa-puzzle-piece";
    const operatingSystems = [OperatingSystem.mac, OperatingSystem.linux, OperatingSystem.windows];
    const supportedOS = leappPluginConfig?.supportedOS || operatingSystems;
    for (const os of supportedOS) {
      if (!operatingSystems.includes(os)) {
        errors.push(`leappPlugin.supportedOS: ${os} is unsupported`);
      }
    }

    const url = leappPluginConfig?.url;

    if (errors.length) {
      throw new Error(errors.join(", "));
    }

    const pluginStatus = this.repository.getPluginStatus(uniqueName);
    return {
      version,
      active: pluginStatus ? pluginStatus.active : true,
      author,
      description,
      supportedOS,
      supportedSessions: supportedSessionTypes,
      icon,
      entryClass,
      keywords,
      uniqueName,
      url,
    };
  }

  private async validatePlugin(
    pluginFilePath,
    options: { folders: { include: string[] }; files: { exclude: string[] } },
    pluginFilePaths,
    i: number
  ): Promise<{ packageJson: string; isPluginValid: boolean }> {
    let isPluginValid = true;
    let packageJsonContent: string;
    try {
      // Hashing file and directory
      const hash = await this._hashElement(pluginFilePath, options);
      if (hash.children) {
        // If it has children then it is a directory
        console.log(hash);
        if (
          // Required files
          this.nativeService.fs.existsSync(pluginFilePath + "/package.json") &&
          this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")
        ) {
          packageJsonContent = this.nativeService.fs.readFileSync(pluginFilePath + "/package.json");
          // Verify signature to enable plugin
          const data = await this.http.get(constants.pluginPortalUrl + `/${pluginFilePaths[i]}`, { responseType: "json" }).toPromise();
          if (data.status !== "active") {
            this.logService.log(new LoggedEntry("Plugin not in active state: " + pluginFilePaths[i], this, LogLevel.warn, true));
            this.nativeService.rimraf(pluginFilePath, () => {});
            isPluginValid = false;
          }

          const verifyMessage = packageJsonContent + hash.hash;
          console.log("verifyMessage: ", verifyMessage);
          console.log("data: ", data);
          const signatureVerified = this.rsaVerifySignatureFromBase64(constants.publicKey, verifyMessage, data.signature);
          console.log(signatureVerified);

          if (!signatureVerified) {
            isPluginValid = false;
          }
        } else {
          console.log(`folder ${pluginFilePath} is not a plugin folder, ignoring...`);
          this.logService.log(new LoggedEntry(`folder ${pluginFilePath} is not a plugin folder, ignoring...`, this, LogLevel.info, false));
          isPluginValid = false;
        }
      }
    } catch (error) {
      console.error("hashing failed or verification failed:", error);
      this.logService.log(new LoggedException(`hashing failed or verification failed: ${error.toString()}`, this, LogLevel.warn, false));
    }
    return { packageJson: JSON.parse(packageJsonContent), isPluginValid };
  }

  private rsaVerifySignatureFromBase64(publicKey, message, signatureBase64): boolean {
    const signature = PluginManagerService.base64Decoding(signatureBase64);
    const verifier = this.nativeService.crypto.createVerify("sha256");
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKey, signature);
  }
}
