import {Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {Observable} from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class FileService extends NativeService {

  /* ====================================================
   * === Wrapper functions over the fs native library ===
   * ==================================================== */

  /**
   * Get the home directory
   * @returns - {string} - path of the home directory
   */
  homeDir(): string {
    return this.os.homedir();
  }

  /**
   * Check if a file or directory exists by passing a path
   * @param - {string} path - the path to check
   * @returns - {boolean} - exists or not
   */
  exists(path: string): boolean {
    return this.fs.existsSync(path);
  }

  /**
   * Get directory name
   * @param - {string} path - the path to retrieve the name
   * @returns - {string} - the directory name
   */
  dirname(path: string): string {
    return this.path.dirname(path);
  }

  /**
   * Read the file
   * @param - {string} filePath - the path of the file to read
   * @returns - {Observable<string>} - the observable to check for
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
   * @param - {string} source
   * @param - {string} target
   */
  copyDir(source: string, target: string) {
    this.copydir.sync(source, target, {mode: true});
  }

  /**
   * Read file sync
   * @param - {string} filePath - read a file in a synchronous way
   * @returns - {string} - return the file directly as string
   */
  readFileSync(filePath: string): string {
    return this.fs.readFileSync(filePath, {encoding: 'utf-8'});
  }

  /**
   * Read a file as base 64
   * @param - {string} filePath - the file to read
   * @returns - {string} - the base64
   */
  readFileSyncBase64(filePath: string): string {
    return this.fs.readFileSync(filePath, {encoding: 'base64'});
  }

  /**
   * Read the directories in a recursive manner
   * @param - {string} source - the source to start from
   * @returns - {any} - data
   */
  getSubDirs(source: string) {
    return this.fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
  }

  /**
   * Unzip a file
   * @param - {string} source
   * @param - {string} target
   * @param - {(err) => any} callback
   */
  unzipFile(source: string, target: string, callback: (err) => any) {
    this.unzip(source, {dir: target}, callback);
  }

  /**
   * Choose a folder with os dialog
   * @returns - {string} - the path of the directory
   */
  chooseFolder(): string {
    return this.dialog.showOpenDialog({properties: ['openDirectory']});
  }

  /**
   * Choose a uses the os filedialog to lewt you choose a file
   * @returns - {string} - the path of the file to open
   */
  chooseFile(): string {
    return this.dialog.showOpenDialog({properties: ['openFile']});
  }

  /**
   * Write a generic file in an asynchronous way
   * @param - {string} filePath
   * @param - {string} content
   * @returns - {Observable<any>}
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
   * @param - {string} filePath
   * @param - {string} content
   * @returns - {any}
   */
  writeFileSync(filePath: string, content: string): any {
    return this.fs.writeFileSync(filePath, content);
  }

  /**
   * Write the ini file passing each key to the writer avoinding the empty key/value couple
   * @param - {string} - filePath
   * @param - content - content is a js object
   * @returns - {Observable<any>} - the result is an observable with the result of the write operation
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
   * @param - {string} - filePath
   * @param - content - content is a js object
   * @returns - {any} - the result of the operation
   */
  iniWriteSync(filePath: string, content: any) {
    Object.keys(content).forEach(key => {
      Object.keys(content[key]).forEach(subKey => {
        if (content[key][subKey] === null || content[key][subKey] === undefined || content[key][subKey] === 'null' || content[key][subKey] === '') {
          delete content[key][subKey];
        }
      });
    });
    console.log('iniWriteSync filePath', filePath);
    console.log('iniWriteSync content', this.ini.stringify(content));
    return this.writeFileSync(filePath, this.ini.stringify(content));
  }

  /**
   * Parse the file asynchronously
   * @param - {string} filePath - the file path of the ini file
   * @returns - {Observable<any>} - return an observable which point to the data
   */
  iniParse(filePath: string): Observable<any> {
    return new Observable(subscriber => {
      this.readFile(filePath).subscribe(file => {
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
   * @param - {string} filePath - the file path of the ini file
   * @returns - {any} - returns the parsed string
   */
  iniParseSync(filePath: string) {
    return this.ini.parse(this.readFileSync(filePath));
  }

  /**
   * Encrypt Text
   */
  encryptText(text: string): string {
    return CryptoJS.AES.encrypt(text.trim(), this.MachineId).toString();
  }

  /**
   * Decrypt Text
   */
  decryptText(text: string): string {
    return CryptoJS.AES.decrypt(text.trim(), this.MachineId).toString(CryptoJS.enc.Utf8);
  }
}
