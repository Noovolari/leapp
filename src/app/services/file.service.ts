import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import * as CryptoJS from 'crypto-js';
import {ElectronService} from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  /* ====================================================
   * === Wrapper functions over the fs native library ===
   * ==================================================== */
  private readSubscription: Subscription;

  constructor(private electronService: ElectronService) {}
  /**
   * Get the home directory
   *
   * @returns - {string} - path of the home directory
   */
  homeDir(): string {
    return this.electronService.os.homedir();
  }

  /**
   * Check if a file or directory exists by passing a path
   *
   * @returns - {boolean} - exists or not
   * @param path - the path of the directory
   */
  exists(path: string): boolean {
    return this.electronService.fs.existsSync(path);
  }

  /**
   * Get directory name
   *
   * @returns - {string} - the directory name
   * @param path - the directory path
   */
  dirname(path: string): string {
    return this.electronService.path.dirname(path);
  }

  /**
   * Read the file
   *
   * @returns - {Observable<string>} - the observable to check for
   * @param filePath - directory path
   */
  readFile(filePath: string): Observable<string> {
    return new Observable(subscriber => {
      this.electronService.fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
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
  copyDir(source: string, target: string) {
    this.electronService.copydir.sync(source, target, {mode: true});
  }

  /**
   * Read file sync
   *
   * @returns - {string} - return the file directly as string
   * @param filePath - Path to read the file
   */
  readFileSync(filePath: string): string {
    return this.electronService.fs.readFileSync(filePath, {encoding: 'utf-8'});
  }

  /**
   * Read the directories in a recursive manner
   *
   * @returns - {any} - data
   * @param source - source of the directory
   */
  getSubDirs(source: string) {
    return this.electronService.fs.readdirSync(source, {withFileTypes: true})
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  /**
   * Creates a new directory
   *
   * @param path - the new directory path
   * @param options - some options if needed - optional
   */
  newDir(path: string, options: { recursive: boolean }): void {
    this.electronService.fs.mkdirSync(path, options);
  }

  /**
   * Choose a uses the os filedialog to lewt you choose a file
   *
   * @returns - {string} - the path of the file to open
   */
  chooseFile(): string {
    return this.electronService.dialog.showOpenDialog({properties: ['openFile']});
  }

  /**
   * Write a generic file in an asynchronous way
   *
   * @returns - {Observable<any>}
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  writeFile(filePath: string, content: string): Observable<any> {
    return new Observable(subscriber => {
      this.electronService.fs.writeFile(filePath, content, (err, data) => {
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
    return this.electronService.fs.writeFileSync(filePath, content);
  }

  /**
   * Write the ini file passing each key to the writer avoinding the empty key/value couple
   *
   * @returns - {Observable<any>} - the result is an observable with the result of the write operation
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  iniWrite(filePath: string, content: any): Observable<any> {
    Object.keys(content).forEach(key => {
      Object.keys(content[key]).forEach(subKey => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === 'null' || content[key][subKey] === '') {
          delete content[key][subKey];
        }
      });
    });
    return this.writeFile(filePath, this.electronService.ini.stringify(content));
  }

  /**
   * Write the ini file passing each key to the writer avoinding the empty key/value couple
   *
   * @returns - {any} - the result of the operation
   * @param filePath - the filepath to write to
   * @param content - the content to write
   */
  iniWriteSync(filePath: string, content: any) {
    Object.keys(content).forEach(key => {
      Object.keys(content[key]).forEach(subKey => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === 'null' || content[key][subKey] === '') {
          delete content[key][subKey];
        }
      });
    });

    const old = this.iniParseSync(filePath);
    const result = Object.assign(old, content);
    return this.writeFileSync(filePath, this.electronService.ini.stringify(result));
  }

  replaceWriteSync(filePath: string, content: any) {
    Object.keys(content).forEach(key => {
      Object.keys(content[key]).forEach(subKey => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === 'null' || content[key][subKey] === '') {
          delete content[key][subKey];
        }
      });
    });
    return this.writeFileSync(filePath, this.electronService.ini.stringify(content));
  }

  /**
   * Parse the file asynchronously
   *
   * @returns - {Observable<any>} - return an observable which point to the data
   * @param filePath - the filepath to read from
   */
  iniParse(filePath: string): Observable<any> {
    return new Observable(subscriber => {
      if (this.readSubscription) {
        this.readSubscription.unsubscribe();
      }
      this.readSubscription = this.readFile(filePath).subscribe(file => {
        try {
          subscriber.next(this.electronService.ini.parse(file));
        } catch (e) {
          subscriber.error(e);
        } finally {
          subscriber.complete();
        }
      }, err => {
        subscriber.error(err);
        subscriber.complete();
      });
    });
  }

  /**
   * Parse the ini file in a synch way
   *
   * @returns - {any} - returns the parsed string
   * @param filePath - the filepath to read from
   */
  iniParseSync(filePath: string) {
    return this.electronService.ini.parse(this.readFileSync(filePath));
  }

  /**
   * Encrypt Text
   */
  encryptText(text: string): string {
    return CryptoJS.AES.encrypt(text.trim(), this.electronService.machineId).toString();
  }

  /**
   * Decrypt Text
   */
  decryptText(text: string): string {
    return CryptoJS.AES.decrypt(text.trim(), this.electronService.machineId).toString(CryptoJS.enc.Utf8);
  }
}
