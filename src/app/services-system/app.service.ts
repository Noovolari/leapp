import {EventEmitter, Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {FileService} from './file.service';
import {ToastrService} from 'ngx-toastr';
import {ConfirmationDialogComponent} from '../shared/confirmation-dialog/confirmation-dialog.component';
import {BsModalService} from 'ngx-bootstrap';
import {FormControl, FormGroup} from '@angular/forms';
import {environment} from '../../environments/environment';
import {SessionService} from '../services/session.service';
import {CredentialsService} from '../services/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class AppService extends NativeService {

  isResuming: EventEmitter<boolean> = new EventEmitter<boolean>();
  profileOpen: EventEmitter<boolean> = new EventEmitter<boolean>();
  avatarSelected: EventEmitter<{havePortrait: boolean, portrait: string}> = new EventEmitter<{havePortrait: boolean, portrait: string}>();

  /* This service is defined to provide different app wide methods as utilities */
  constructor(
    private fileService: FileService,
    private toastr: ToastrService,
    private modalService: BsModalService,
  ) {
    super();
  }

  /**
   * Return the app object from node
   */
  getApp() {
    return this.app;
  }

  /**
   * Return Electron ipcRenderer
   */
  getIpcRenderer() {
    return this.ipcRenderer;
  }

  /**
   * In theory this method would monitor the information data and check if we are suspending the PC.
   */
  enablePowerMonitorFeature() {
    this.app.on('ready', () => {
      this.powerMonitor.on('suspend', () => {
        this.log.info('The system is going to resume');
        this.isResuming.emit(true);
      });
    });
  }

  /**
   * Log the message to a file and also to console for development mode
   * @param message - the message to log
   * @param type - the LoggerLevel type
   */
  logger(message: string, type: LoggerLevel) {
    switch (type) {
      case LoggerLevel.INFO:
        this.log.info(message);
        break;
      case LoggerLevel.WARN:
        this.log.warn();
        break;
      case LoggerLevel.ERROR:
        this.log.error(message);
        break;
      default:
        this.log.info(message);
        break;
    }
  }

  /**
   * Get the current browser window
   * @returns - {any} -
   */
  currentBrowserWindow() {
    return this.currentWindow;
  }

  /**
   * Quit the app
   */
  quit() {
    this.app.exit(0);
  }

  /**
   * Restart the app
   */
  restart() {
    this.app.relaunch();
    this.app.exit(0);
  }

  /**
   * Change the current browser window url using the file protocol to point to a local project's file
   * @param url - the url to point to
   * @param javascript - the javascript to run at browser window loaded
   */
  changeCurrentWindowURL(url: string, javascript?: string) {
    this.currentWindow.dir = this.fileService.dirname(url);
    this.currentWindow.loadURL(this.url.format({
        pathname: url,
        protocol: 'file:',
        slashes: true
    }));
    this.currentWindow.webContents.on('did-finish-load', () => {
      console.warn();
      if (javascript) {
        this.currentWindow.webContents.executeJavaScript(javascript);
      }
    });
  }

  /**
   * Change the current browser window url to points to something else
   * @param url - url to point to
   */
  changeCurrentWindowOnlineUrl(url: string) {
    this.currentWindow.loadURL(url);
  }

  /**
   * Create a new browser window
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @param title - the window title
   * @param x - position x
   * @param y - position y
   * @param javascript - javascript to be run when the window starts
   * @returns return a new browser window
   */
  newWindow(url: string, show: boolean, title?: string, x?: number, y?: number, javascript?: string) {
    // console.log(show);
    // console.log(localStorage.getItem('hook_mail'));

    const opts = {
      width: 430,
      height: 550,
      resizable: true,
      show,
      title,
      titleBarStyle: 'hidden',
      webPreferences: {
        devTools: true,
        sandbox: true,
        nodeIntegration: false,
        allowRunningInsecureContent: true
      }
    };

    if (x && y) {
      Object.assign(opts, {
        x: x + 50,
        y: y + 50
      });
    }
    const newWin = new this.browserWindow(opts);
    return newWin;
  }

  /**
   * Create a new invisible browser window
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @returns return a new browser window
   */
  newInvisibleWindow(url: string) {
    const win = new this.browserWindow({ width: 1, height: 1, show: false });
    win.loadURL(url);
    return win;
  }

  /**
   * Return the type of OS in human readable form
   */
  detectOs() {
    const hrNames = {
      linux: 'linux',
      darwin: 'mac',
      win32: 'windows'
    };
    const os = this.os.platform();
    return hrNames[os];
  }

  /**
   * Show a toast message with different styles for different type of toast
   * @param message - the message to show
   * @param type - the type of message from Toast Level
   * @param title - [optional]
   */
  toast(message, type, title?: string) {
    switch (type) {
      case ToastLevel.SUCCESS: this.toastr.success(message, title); break;
      case ToastLevel.INFO: this.toastr.info(message, title); break;
      case ToastLevel.WARN: this.toastr.warning(message, title); break;
      case ToastLevel.ERROR: this.toastr.error(message, 'Invalid Action!'); break;
    }
  }

  /**
   * Return the aws credential path so we have only one point in the application where we need to adjust it!
   * @returns the credential path string
   */
  awsCredentialPath() {
   return this.path.join(this.os.homedir(), '.aws', 'credentials');
  }

  /**
   * Return the semantic version object for version checks and operation
   * @returns the semver object
   */
  semVer() {
    return this.semver;
  }

  /**
   * Copy the selected text to clipboard
   * @param text - the element to copy to clipboard
   */
  copyToClipboard(text: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  /**
   * Standard parsing of a json JWT token without library
   * @param token - a string token
   * @returns the json object decoded
   */
  parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  }

  /**
   * Confirmation dialog popup!
   * @param message - the message to show
   * @param callback - the callback for the ok button to launch
   */
  confirmDialog(message: string, callback: any) {
    this.modalService.show(ConfirmationDialogComponent, { backdrop: 'static', animated: false, class: 'confirm-modal', initialState: { message, callback}});
  }

  /**
   * With this one you can open an url in an external browser
   * @param url - url to open
   */
  openExternalUrl(url) {
    this.shell.openExternal(url);
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  /**
   * Extract an account number from a AWS arn
   * @param value - arn value
   * @returns - {any} - the
   */
  extractAccountNumberFromIdpArn(value) {

    const values = value.split(':');
    // console.log(values);
    if (
      values.length === 6 &&
      values[0] === 'arn' &&
      values[1] === 'aws' &&
      values[2] === 'iam' &&
      values[3] === '') {

      if (values[4].length === 12 && Number(values[4])) {
        // console.log(values[4]);
        return values[4];
      } else  { return ''; }
    } else  { return ''; }
  }

  /**
   * Get all typical EC2 regions
   * @param useDefault - to show no region
   * @returns - {{region: string}[]} - all the regions in array format
   */

  getRegions(useDefault?: boolean) {
    const regions = [
      { region: 'no region necessary'},
      { region: 'eu-west-1' },
      { region: 'eu-west-2' },
      { region: 'eu-west-3' },
      { region: 'eu-south-1' },
      { region: 'eu-central-1' },
      { region: 'us-east-2' },
      { region: 'us-east-1' },
      { region: 'us-west-1' },
      { region: 'us-west-2' },
      { region: 'ap-east-1' },
      { region: 'ap-south-1' },
      { region: 'ap-northeast-3' },
      { region: 'ap-northeast-2' },
      { region: 'ap-southeast-1' },
      { region: 'ap-southeast-2' },
      { region: 'ap-northeast-1' },
      { region: 'ca-central-1' },
      { region: 'cn-north-1' },
      { region: 'cn-northwest-1' },
      { region: 'eu-north-1' },
      { region: 'me-south-1' },
      { region: 'sa-east-1' },
      { region: 'us-gov-east-1' },
      { region: 'us-gov-west-1' }
    ];
    return (useDefault === undefined || useDefault === true) ? regions : regions.slice(1, -1);
  }

  /**
   * To use EC2 services with the client you need to change the
   * request header because the origin for electron app is of type file
   */
  setFilteringForEc2Calls() {
    // Modify the user agent for all requests to the following urls.
    const filter = { urls: ['https://*.amazonaws.com/'] };

    this.session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      details.requestHeaders['Origin'] = 'http://localhost:4200';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
  }



  cleanCredentialFile() {
    try {
      const awsCredentialsPath = this.awsCredentialPath();
      // Rewrite credential file
      this.fs.writeFileSync(awsCredentialsPath, '');
    } catch (e) {
      this.logger(`Can\'t delete aws credential file probably missing: ${e.toString()}`, LoggerLevel.WARN);
    }
  }

}

/*
* External enum to the logger level so we can use this to define the type of log
*/
export enum LoggerLevel {
  INFO,
  WARN,
  ERROR
}
/*
* External enum to the toast level so we can use this to define the type of log
*/
export enum ToastLevel {
  INFO,
  WARN,
  ERROR,
  SUCCESS
}
