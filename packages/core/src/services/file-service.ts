import { Subscription } from "rxjs";
import { INativeService } from "../interfaces/i-native-service";

const cryptoJS = require("crypto-js");

export class FileService {
  private readSubscription: Subscription;
  private _aesKey: string;

  constructor(private nativeService: INativeService) {
    this.aesKey = this.nativeService.machineId;
  }

  get aesKey(): string {
    return this._aesKey;
  }

  set aesKey(value: string) {
    this._aesKey = value;
  }

  /* ====================================================
   * === Wrapper functions over the fs native library ===
   * ==================================================== */

  /**
   * Get the home directory
   *
   * @returns - {string} - path of the home directory
   */
  homeDir(): string {
    return this.nativeService.os.homedir();
  }

  /**
   * Check if a file or directory exists by passing a path
   *
   * @returns - {boolean} - exists or not
   * @param path - the path of the directory
   */
  existsSync(path: string): boolean {
    return this.nativeService.fs.existsSync(path);
  }

  renameSync(oldPath: string, newPath: string): void {
    this.nativeService.fs.renameSync(oldPath, newPath);
  }

  /**
   * Get directory name
   *
   * @returns - {string} - the directory name
   * @param path - the directory path
   */
  dirname(path: string): string {
    return this.nativeService.path.dirname(path);
  }

  /**
   * Copy the directory
   *
   * @param source - source directory
   * @param target - target directory
   */
  copyDir(source: string, target: string): void {
    this.nativeService.copydir.sync(source, target, { mode: true });
  }

  /**
   * Read file sync
   *
   * @returns - {string} - return the file directly as string
   * @param filePath - Path to read the file
   */
  readFileSync(filePath: string): string {
    return this.nativeService.fs.readFileSync(filePath, { encoding: "utf-8" });
  }

  /**
   * Read the directories in a recursive manner
   *
   * @returns - {any} - data
   * @param source - source of the directory
   */
  getSubDirs(source: string): string[] {
    return this.nativeService.fs
      .readdirSync(source, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);
  }

  /**
   * Creates a new directory
   *
   * @param path - the new directory path
   * @param options - some options if needed - optional
   */
  newDir(path: string, options: { recursive: boolean }): void {
    this.nativeService.fs.mkdirSync(path, options);
  }

  /**
   * Write a generic file in a synchronous way
   *
   * @returns - {any}
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  writeFileSync(filePath: string, content: string): any {
    return this.nativeService.fs.writeFileSync(filePath, content);
  }

  writeFileSyncWithOptions(filePath: string, content: string, options: any): any {
    return this.nativeService.fs.writeFileSync(filePath, content, options);
  }

  /**
   * Remove a file in a synchronous way
   *
   * @returns - {void}
   * @param filePath - the filepath to remove
   */
  removeFileSync(filePath: string): void {
    this.nativeService.fs.removeSync(filePath);
  }

  /**
   * Write the ini file passing each key to the writer avoinding the empty key/value couple
   *
   * @returns - {any} - the result of the operation
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  iniWriteSync(filePath: string, content: any): any {
    Object.keys(content).forEach((key) => {
      Object.keys(content[key]).forEach((subKey) => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === "null" || content[key][subKey] === "") {
          delete content[key][subKey];
        }
      });
    });

    const old = this.iniParseSync(filePath);
    const result = Object.assign(old, content);
    return this.writeFileSync(filePath, this.nativeService.ini.stringify(result));
  }

  replaceWriteSync(filePath: string, content: any): any {
    Object.keys(content).forEach((key) => {
      Object.keys(content[key]).forEach((subKey) => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === "null" || content[key][subKey] === "") {
          delete content[key][subKey];
        }
      });
    });
    return this.writeFileSync(filePath, this.nativeService.ini.stringify(content));
  }

  /**
   * Parse the ini file in a synch way
   *
   * @returns - {any} - returns the parsed string
   * @param filePath - the filepath to read from
   */
  iniParseSync(filePath: string): any {
    return this.nativeService.ini.parse(this.readFileSync(filePath));
  }

  // TODO: move these methods under another service, or try to replace them with encryptionService stuff from leapp-basement
  /**
   * Encrypt Text
   */
  encryptText(text: string): string {
    return cryptoJS.AES.encrypt(text.trim(), this.aesKey).toString();
  }

  /**
   * Decrypt Text
   */
  decryptText(text: string): string {
    return cryptoJS.AES.decrypt(text.trim(), this.aesKey).toString(cryptoJS.enc.Utf8);
  }
}
