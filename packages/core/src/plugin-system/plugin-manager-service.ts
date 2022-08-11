import { IPlugin, IPluginMetadata } from "./interfaces/i-plugin";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "../services/log-service";
import { constants } from "../models/constants";
import { Repository } from "../services/repository";
import { SessionType } from "../models/session-type";
import { OperatingSystem } from "../models/operating-system";
import { Session } from "../models/session";
import { SessionFactory } from "../services/session-factory";
import { PluginEnvironment } from "./plugin-environment";

export class PluginManagerService {
  private _plugins: IPlugin[];
  private _requireModule;
  private _hashElement;
  private _pluginDir = "plugins";

  constructor(
    public pluginEnvironment: PluginEnvironment,
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

  getPluginByName(name: string): IPlugin {
    return this._plugins.find((plugin) => plugin.metadata.uniqueName === name);
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

    const pluginDirContent = this.nativeService.fs.readdirSync(this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir);
    for (const pluginName of pluginDirContent) {
      const pluginFilePath = this.nativeService.os.homedir() + "/.Leapp/" + this._pluginDir + "/" + pluginName;
      const isDir = this.nativeService.fs.existsSync(pluginFilePath) && this.nativeService.fs.lstatSync(pluginFilePath).isDirectory();
      if (isDir) {
        // VALIDATION PROCESS
        const { packageJson, isPluginValid } = await this.validatePlugin(pluginFilePath, options, pluginName);

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
        const isSignatureInvalid = !isPluginValid && !this.skipPluginValidation();
        if (isSignatureInvalid) {
          this.logService.log(new LoggedEntry(`Signature not verified for plugin: ${pluginName}`, this, LogLevel.warn, true));
          await this.nativeService.fs.remove(pluginFilePath);
          continue;
        }

        // LOAD
        try {
          if (this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")) {
            const pluginModule = this._requireModule(pluginFilePath + "/plugin.js");
            this.logService.log(new LoggedEntry(`loading ${pluginName} plugin`, this, LogLevel.info, false));

            const plugin = new pluginModule[metadata.entryClass]() as IPlugin;
            (plugin as any).metadata = metadata;
            if (!this.repository.getPluginStatus(plugin.metadata.uniqueName)) {
              this.repository.createPluginStatus(plugin.metadata.uniqueName);
            }
            this._plugins.push(plugin);
            if (plugin.metadata.active) {
              await plugin.bootstrap(this.pluginEnvironment);
            }
          }
        } catch (error) {
          this.logService.log(new LoggedException(`error loading plugin ${pluginName}: ${error.message}`, this, LogLevel.error, true));
        }
      }
    }
  }

  unloadAllPlugins(): void {
    this._plugins = [];
  }

  unloadSinglePlugin(name: string): void {
    const pluginIndex = this._plugins.map((p) => p.metadata.uniqueName).indexOf(name);
    if (pluginIndex > -1) {
      this._plugins.splice(pluginIndex, 1);
    }
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

  async installPlugin(url: string): Promise<void> {
    const packageName = url.replace("leapp://", "");
    const pluginsDir = this.nativeService.os.homedir() + "/.Leapp/plugins";

    this.logService.log(new LoggedEntry(`We are ready to install Plugin ${packageName}, please wait...`, this, LogLevel.info, true));

    const npmMetadata = await this.http.get(`https://registry.npmjs.org/${packageName}`, { responseType: "json" }).toPromise();
    const version = npmMetadata["dist-tags"].latest;
    const tarballUrl = npmMetadata.versions[version].dist.tarball;
    const tarballPathComponents = tarballUrl.split("/");
    const tarballFileName = tarballPathComponents[tarballPathComponents.length - 1];
    const tarballBuffer = await this.http.get(tarballUrl, { responseType: "arraybuffer" }).toPromise();
    const tarballFilePath = this.nativeService.path.join(pluginsDir, tarballFileName);
    this.nativeService.fs.writeFileSync(tarballFilePath, Buffer.from(tarballBuffer));

    const pluginDir = this.nativeService.path.join(pluginsDir, packageName);
    await this.nativeService.fs.remove(pluginDir);
    await this.nativeService.fs.ensureDir(pluginDir);

    await this.nativeService.tar.x({
      file: tarballFilePath,
      strip: 1,
      ["C"]: pluginDir,
    });

    await this.nativeService.fs.remove(tarballFilePath);
    this.logService.log(new LoggedEntry(`Plugin ${packageName} installed correctly.`, this, LogLevel.info, true));
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
    pluginFilePath: string,
    options: { folders: { include: string[] }; files: { exclude: string[] } },
    pluginName: string
  ): Promise<{ packageJson: string; isPluginValid: boolean }> {
    let packageJson: string;
    try {
      // Hashing file and directory
      const hash = await this._hashElement(pluginFilePath, options);
      if (!hash.children) {
        return { packageJson, isPluginValid: false };
      }
      // If it has children then it is a directory
      if (
        // Required files
        this.nativeService.fs.existsSync(pluginFilePath + "/package.json") &&
        this.nativeService.fs.existsSync(pluginFilePath + "/plugin.js")
      ) {
        const packageJsonContent = this.nativeService.fs.readFileSync(pluginFilePath + "/package.json");
        packageJson = JSON.parse(packageJsonContent);
        // Verify signature to enable plugin
        const data = await this.http.get(constants.pluginPortalUrl + `/${pluginName}`, { responseType: "json" }).toPromise();
        if (data.status !== "active") {
          this.logService.log(new LoggedEntry("Plugin not in active state: " + pluginName, this, LogLevel.warn, true));
          return { packageJson, isPluginValid: false };
        }

        const verifyMessage = packageJsonContent + hash.hash;
        const signatureVerified = this.rsaVerifySignatureFromBase64(constants.publicKey, verifyMessage, data.signature);

        if (!signatureVerified) {
          return { packageJson, isPluginValid: false };
        }
      } else {
        this.logService.log(new LoggedEntry(`folder ${pluginFilePath} is not a plugin folder, ignoring...`, this, LogLevel.info, false));
        return { packageJson, isPluginValid: false };
      }
    } catch (error) {
      this.logService.log(new LoggedException(`hashing failed or verification failed: ${error.message}`, this, LogLevel.warn, false));
      return { packageJson, isPluginValid: false };
    }
    return { packageJson, isPluginValid: true };
  }

  private rsaVerifySignatureFromBase64(publicKey, message, signatureBase64): boolean {
    const signature = PluginManagerService.base64Decoding(signatureBase64);
    const verifier = this.nativeService.crypto.createVerify("sha256");
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKey, signature);
  }

  private skipPluginValidation() {
    return constants.skipPluginValidation;
  }
}
