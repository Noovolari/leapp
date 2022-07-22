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
        let metadata;
        try {
          metadata = this.extractMetadata(packageJson);
        } catch (errors) {
          this.logService.log(
            new LoggedEntry(`Missing or invalid values in plugin ${pluginName} package.json: ${errors.message}`, this, LogLevel.warn, true)
          );
          this.nativeService.rimraf(pluginFilePath, () => {});
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

            console.log(packageJson);
            const plugin = new pluginModule[packageJson.entryClass]() as any;
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
    const privateKey =
      "-----BEGIN RSA PRIVATE KEY-----\n" +
      "Proc-Type: 4,ENCRYPTED\n" +
      "DEK-Info: DES-EDE3-CBC,E0921645FA82585C\n" +
      "\n" +
      "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\n" +
      "-----END RSA PRIVATE KEY-----\n";
    const signer = this.nativeService.crypto.createSign("sha256");
    signer.update(message);
    signer.end();
    const signature = signer.sign({
      key: privateKey,
      format: "pem",
      type: "pkcs1",
      passphrase: "DkgCF3wYa6N@urrtUxNLaE#e8*woRm6Ld$k&qBJg8P7LEEVJ3s*nXdQKDC8*NEZ0",
    });
    return signature.toString("Base64");
  }

  availablePlugins(os: OperatingSystem, session: Session): IPlugin[] {
    return this._plugins.filter(
      (plugin) =>
        plugin.metadata.active &&
        plugin.metadata.supportedOS.includes(os) &&
        (plugin.metadata.supportedSessions.includes(session.type) ||
          plugin.metadata.supportedSessions.includes(SessionType.anytype) ||
          //TODO: when writing tests, fix when AWS and Azure session types are specified together
          session.type.toString().indexOf(plugin.metadata.supportedSessions.join("")) > -1)
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
    const supportedSessionTypes = leappPluginConfig?.supportedSessions || [SessionType.anytype];
    if (!supportedSessionTypes.length) {
      errors.push("supportedSessions");
    }
    for (const sessionType of supportedSessionTypes) {
      if (this.sessionFactory.getCompatibleTypes(sessionType).length === 0) {
        errors.push(`${sessionType} unsupported session`);
      }
    }

    const icon = leappPluginConfig?.icon || "fas fa-puzzle-piece";
    const operatingSystems = [OperatingSystem.mac, OperatingSystem.linux, OperatingSystem.windows];
    const supportedOS = leappPluginConfig?.supportedOS || operatingSystems;
    for (const os of supportedOS) {
      if (!operatingSystems.includes(os)) {
        errors.push(`unsupported os ${os}`);
      }
    }

    const url = leappPluginConfig.url;

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
  ) {
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
