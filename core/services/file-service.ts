import { Observable, Subscription } from "rxjs";
import { INativeService } from "../interfaces/i-native-service";
//import * as CryptoJS from 'crypto-js';

// TODO: when core will use tsconfig "moduleResolution": "ES2020", this require still generates warnings compiling the desktop app
const cryptoJS = require("crypto-js");

export class FileService {
  private readSubscription: Subscription;

  constructor(private nativeService: INativeService) {}

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
   * Read the file
   *
   * @returns - {Observable<string>} - the observable to check for
   * @param filePath - directory path
   */
  readFile(filePath: string): Observable<string> {
    return new Observable((subscriber) => {
      this.nativeService.fs.readFile(filePath, { encoding: "utf-8" }, (err: any, data: any) => {
        if (err) {
          subscriber.error(err);
        } else {
          subscriber.next(data);
        }
        subscriber.complete();
      });
    });
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
   * Write a generic file in an asynchronous way
   *
   * @returns - {Observable<any>}
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  writeFile(filePath: string, content: string): Observable<any> {
    return new Observable((subscriber) => {
      this.nativeService.fs.writeFile(filePath, content, (err: any, data: any) => {
        if (err) {
          subscriber.error(err);
        } else {
          subscriber.next(data);
        }
        subscriber.complete();
      });
    });
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

  /**
   * Write the ini file passing each key to the writer avoinding the empty key/value couple
   *
   * @returns - {Observable<any>} - the result is an observable with the result of the write operation
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  iniWrite(filePath: string, content: any): Observable<any> {
    Object.keys(content).forEach((key) => {
      Object.keys(content[key]).forEach((subKey) => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === "null" || content[key][subKey] === "") {
          delete content[key][subKey];
        }
      });
    });
    return this.writeFile(filePath, this.nativeService.ini.stringify(content));
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
   * Parse the file asynchronously
   *
   * @returns - {Observable<any>} - return an observable which point to the data
   * @param filePath - the filepath to read from
   */
  iniParse(filePath: string): Observable<any> {
    return new Observable((subscriber) => {
      if (this.readSubscription) {
        this.readSubscription.unsubscribe();
      }
      this.readSubscription = this.readFile(filePath).subscribe(
        (file) => {
          try {
            subscriber.next(this.nativeService.ini.parse(file));
          } catch (e) {
            subscriber.error(e);
          } finally {
            subscriber.complete();
          }
        },
        (err) => {
          subscriber.error(err);
          subscriber.complete();
        }
      );
    });
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
    return cryptoJS.AES.encrypt(text.trim(), this.nativeService.machineId).toString();
  }

  /**
   * Decrypt Text
   */
  decryptText(text: string): string {
    return cryptoJS.AES.decrypt(text.trim(), this.nativeService.machineId).toString(cryptoJS.enc.Utf8);
  }
}
