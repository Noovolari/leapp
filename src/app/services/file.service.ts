import {Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {Observable, Subscription} from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class FileService extends NativeService {

  /* ====================================================
   * === Wrapper functions over the fs native library ===
   * ==================================================== */
  private readSubscription: Subscription;

  /**
   * Get the home directory
   *
   * @returns - {string} - path of the home directory
   */
  homeDir(): string {
    return this.os.homedir();
  }

  /**
   * Check if a file or directory exists by passing a path
   *
   * @returns - {boolean} - exists or not
   * @param path - the path of the directory
   */
  exists(path: string): boolean {
    return this.fs.existsSync(path);
  }

  /**
   * Get directory name
   *
   * @returns - {string} - the directory name
   * @param path - the directory path
   */
  dirname(path: string): string {
    return this.path.dirname(path);
  }

  /**
   * Read the file
   *
   * @returns - {Observable<string>} - the observable to check for
   * @param filePath - directory path
   */
  readFile(filePath: string): Observable<string> {
    return new Observable(subscriber => {
        this.fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
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
    this.copydir.sync(source, target, {mode: true});
  }

  /**
   * Read file sync
   *
   * @returns - {string} - return the file directly as string
   * @param filePath - Path to read the file
   */
  readFileSync(filePath: string): string {
    return this.fs.readFileSync(filePath, {encoding: 'utf-8'});
  }

  /**
   * Read the directories in a recursive manner
   *
   * @returns - {any} - data
   * @param source - source of the directory
   */
  getSubDirs(source: string) {
    return this.fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
  }

  /**
   * Creates a new directory
   * @param path - the new directory path
   * @param options - some options if needed - optional
   */
  newDir(path: string, options: {recursive: boolean}): void {
    this.fs.mkdirSync(path, options);
  }

  /**
   * Choose a uses the os filedialog to lewt you choose a file
   *
   * @returns - {string} - the path of the file to open
   */
  chooseFile(): string {
    return this.dialog.showOpenDialog({properties: ['openFile']});
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
        this.fs.writeFile(filePath, content, (err, data) => {
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
    return this.fs.writeFileSync(filePath, content);
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
    return this.writeFile(filePath, this.ini.stringify(content));
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
    return this.writeFileSync(filePath, this.ini.stringify(result));
  }

  replaceWriteSync(filePath: string, content: any) {
    Object.keys(content).forEach(key => {
      Object.keys(content[key]).forEach(subKey => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === 'null' || content[key][subKey] === '') {
          delete content[key][subKey];
        }
      });
    });
    return this.writeFileSync(filePath, this.ini.stringify(content));
  }

  iniCheckProfileExistance(filePath: string, profileName: string): boolean {
    const currentCredentialFile = this.iniParseSync(filePath);
    return currentCredentialFile[profileName] !== undefined;
  }

  iniCleanSync(filePath: string) {
    return this.writeFileSync(filePath, this.ini.stringify({}));
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
          subscriber.next(this.ini.parse(file));
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
    return this.ini.parse(this.readFileSync(filePath));
  }

  /**
   * Encrypt Text
   */
  encryptText(text: string): string {
    return CryptoJS.AES.encrypt(text.trim(), this.machineId).toString();
  }

  /**
   * Decrypt Text
   */
  decryptText(text: string): string {
    return CryptoJS.AES.decrypt(text.trim(), this.machineId).toString(CryptoJS.enc.Utf8);
  }
}
