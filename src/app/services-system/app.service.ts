import {EventEmitter, Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {FileService} from './file.service';
import {ToastrService} from 'ngx-toastr';
import {ConfirmationDialogComponent} from '../shared/confirmation-dialog/confirmation-dialog.component';
import {BsModalService} from 'ngx-bootstrap';
import {FormControl, FormGroup} from '@angular/forms';
import {environment} from '../../environments/environment';
import {InputDialogComponent} from '../shared/input-dialog/input-dialog.component';
import {constants} from '../core/enums/constants';

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

@Injectable({
  providedIn: 'root'
})
export class AppService extends NativeService {

  profileOpen: EventEmitter<boolean> = new EventEmitter<boolean>();
  redrawList: EventEmitter<boolean> = new EventEmitter<boolean>();

  newWin;

  version: string;
  releaseName: string;
  releaseDate: string;
  releaseNotes: string;

  stsEndpointsPerRegion = new Map([
    ['af-south-1', 'https://sts.af-south-1.amazonaws.com'],
    ['ap-east-1', 'https://sts.ap-east-1.amazonaws.com'],
    ['ap-northeast-1', 'https://sts.ap-northeast-1.amazonaws.com'],
    ['ap-northeast-2', 'https://sts.ap-northeast-2.amazonaws.com'],
    ['ap-northeast-3', 'https://sts.ap-northeast-3.amazonaws.com'],
    ['ap-south-1', 'https://sts.ap-south-1.amazonaws.com'],
    ['ap-southeast-1', 'https://sts.ap-southeast-1.amazonaws.com'],
    ['ap-southeast-2', 'https://sts.ap-southeast-2.amazonaws.com'],
    ['ca-central-1', 'https://sts.ca-central-1.amazonaws.com'],
    ['cn-north-1', 'https://sts.cn-north-1.amazonaws.com.cn'],
    ['cn-northwest-1', 'https://sts.cn-northwest-1.amazonaws.com.cn'],
    ['eu-central-1', 'https://sts.eu-central-1.amazonaws.com'],
    ['eu-north-1', 'https://sts.eu-north-1.amazonaws.com'],
    ['eu-south-1', 'https://sts.eu-south-1.amazonaws.com'],
    ['eu-west-1', 'https://sts.eu-west-1.amazonaws.com'],
    ['eu-west-2', 'https://sts.eu-west-2.amazonaws.com'],
    ['eu-west-3', 'https://sts.eu-west-3.amazonaws.com'],
    ['me-south-1', 'https://sts.me-south-1.amazonaws.com'],
    ['sa-east-1', 'https://sts.sa-east-1.amazonaws.com'],
    ['us-east-1', 'https://sts.us-east-1.amazonaws.com'],
    ['us-east-2', 'https://sts.us-east-2.amazonaws.com'],
    ['us-gov-east-1', 'https://sts.us-gov-east-1.amazonaws.com'],
    ['us-gov-west-1', 'https://sts.us-gov-west-1.amazonaws.com'],
    ['us-west-1', 'https://sts.us-west-1.amazonaws.com'],
    ['us-west-2', 'https://sts.us-west-2.amazonaws.com']
  ]);

  /* This service is defined to provide different app wide methods as utilities */
  constructor(
    private fileService: FileService,
    private toastr: ToastrService,
    private modalService: BsModalService
  ) {
    super();

    // Global Configure logger
    this.log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}';
    this.log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}';
  }

  /**
   * Return the app object from node
   */
  getApp() {

    return this.app;
  }

  getMenu() {
    return this.Menu;
  }

  getTray() {
    return this.Tray;
  }

  getCurrentWindow() {
    return this.currentWindow;
  }

  getFollowRedirects() {
    return this.followRedirects;
  }

  /**
   * Return the dialog native object
   */
  getDialog() {
    return this.dialog;
  }

  /**
   * Return the native os object
   */
  getOS() {
    return this.os;
  }

  /**
   * Return the fs native object
   */
  getFs() {
    return this.fs;
  }

  /**
   * Return the app process
   */
  getProcess() {
    return this.process;
  }

  /**
   * Return Electron ipcRenderer
   */
  getIpcRenderer() {
    return this.ipcRenderer;
  }

  /**
   * Log the message to a file and also to console for development mode
   * @param message - the message to log
   * @param type - the LoggerLevel type
   * @param instance -
   * @param stackTrace -
   */
  logger(message: any, type: LoggerLevel, instance?: any, stackTrace?: string) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message, null, 3);
    }

    if (instance) {
      message = `[${instance.constructor['name']}] ${message}`;
    }

    if (stackTrace) {
      message = `${message} ${stackTrace}`;
    }

    switch (type) {
      case LoggerLevel.INFO:
        if (!environment.production) {
          this.log.info(message);
        }
        break;
      case LoggerLevel.WARN:
        if (!environment.production) {
          this.log.warn(message);
        }
        break;
      case LoggerLevel.ERROR:
        this.log.error(message);
        break;
      default:
        if (!environment.production) {
          this.log.info(message);
        }
        break;
    }
  }

  getLog() {
    return this.log;
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
   * Create a new browser window
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @param show - show the window
   * @param title - the window title
   * @param x - position x
   * @param y - position y
   * @param javascript - javascript to be run when the window starts
   * @returns return a new browser window
   */
  newWindow(url: string, show: boolean, title?: string, x?: number, y?: number, javascript?: string) {
    const opts = {
      width: 430,
      height: 550,
      resizable: true,
      show,
      title,
      titleBarStyle: 'hidden',
      webPreferences: {
        devTools: !environment.production,
        worldSafeExecuteJavaScript: true,
        partition: `persist:Leapp-${btoa(url)}`
      }
    };

    if (x && y) {
      Object.assign(opts, {
        x: x + 50,
        y: y + 50
      });
    }

    if (this.newWin) {
      console.log('new win', this.newWin);
      try {
        this.newWin.close();
      } catch (e) {
      }
      this.newWin = null;
    }
    this.newWin = new this.browserWindow(opts);
    return this.newWin;
  }

  /**
   * Create a new invisible browser window
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @returns return a new browser window
   */
  newInvisibleWindow(url: string) {
    const win = new this.browserWindow({width: 1, height: 1, show: false});
    win.loadURL(url);
    return win;
  }

  /**
   * Return the type of OS in human readable form
   */
  detectOs() {
    const hrNames = {
      linux: constants.LINUX,
      darwin: constants.MAC,
      win32: constants.WINDOWS
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
      case ToastLevel.SUCCESS:
        this.toastr.success(message, title);
        break;
      case ToastLevel.INFO:
        this.toastr.info(message, title);
        break;
      case ToastLevel.WARN:
        this.toastr.warning(message, title);
        break;
      case ToastLevel.ERROR:
        this.toastr.error(message, 'Invalid Action!');
        break;
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
    for (let i = 1; i <= this.modalService.getModalsCount(); i++) {
      this.modalService.hide(i);
    }
    this.modalService.show(ConfirmationDialogComponent, {
      backdrop: 'static',
      animated: false,
      class: 'confirm-modal',
      initialState: {message, callback}
    });
  }

  /**
   * Input dialog popup!
   * @param title - the title of the popup
   * @param placeholder - placeholder for the input
   * @param message - the message to show
   * @param callback - the callback for the ok button to launch
   */
  inputDialog(title: string, placeholder: string, message: string, callback: any) {
    for (let i = 1; i <= this.modalService.getModalsCount(); i++) {
      this.modalService.hide(i);
    }
    this.modalService.show(InputDialogComponent, {
      backdrop: 'static',
      animated: false,
      class: 'confirm-modal',
      initialState: {title, placeholder, message, callback}
    });
  }

  /**
   * With this one you can open an url in an external browser
   * @param url - url to open
   */
  openExternalUrl(url) {
    this.shell.openExternal(url);
  }

  /**
   * Useful to validate all form field at once if needed
   * @param formGroup - the form formGroup
   */
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({onlySelf: true});
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
    if (
      values.length === 6 &&
      values[0] === 'arn' &&
      values[1] === 'aws' &&
      values[2] === 'iam' &&
      values[3] === '') {

      if (values[4].length === 12 && Number(values[4])) {
        return values[4];
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /**
   * Get all AWS regions
   * @returns - [{region: string}] - all the regions in array format
   */
  getRegions() {
    return [
      {region: 'af-south-1'},
      {region: 'ap-east-1'},
      {region: 'ap-northeast-1'},
      {region: 'ap-northeast-2'},
      {region: 'ap-northeast-3'},
      {region: 'ap-south-1'},
      {region: 'ap-southeast-1'},
      {region: 'ap-southeast-2'},
      {region: 'ca-central-1'},
      {region: 'cn-north-1'},
      {region: 'cn-northwest-1'},
      {region: 'eu-central-1'},
      {region: 'eu-north-1'},
      {region: 'eu-south-1'},
      {region: 'eu-west-1'},
      {region: 'eu-west-2'},
      {region: 'eu-west-3'},
      {region: 'me-south-1'},
      {region: 'sa-east-1'},
      {region: 'us-east-1'},
      {region: 'us-east-2'},
      {region: 'us-gov-east-1'},
      {region: 'us-gov-west-1'},
      {region: 'us-west-1'},
      {region: 'us-west-2'}
    ];
  }

  /**
   * Get all Azure locations
   * @returns - {region: string}[] - all the regions in array format
   */
  getLocations() {
    return [
      {location: 'eastus'},
      {location: 'eastus2'},
      {location: 'southcentralus'},
      {location: 'australiaeast'},
      {location: 'southeastasia'},
      {location: 'northeurope'},
      {location: 'uksouth'},
      {location: 'westeurope'},
      {location: 'centralus'},
      {location: 'northcentralus'},
      {location: 'southafricanorth'},
      {location: 'centralindia'},
      {location: 'eastasia'},
      {location: 'japaneast'},
      {location: 'koreacentral'},
      {location: 'canadacentral'},
      {location: 'francecentral'},
      {location: 'germanywestcentral'},
      {location: 'norwayeast'},
      {location: 'switzerlandnorth'},
      {location: 'uaenorth'},
      {location: 'brazilsouth'},
      {location: 'centralusstage'},
      {location: 'eastusstage'},
      {location: 'eastus2stage'},
      {location: 'northcentralusstage'},
      {location: 'southcentralusstage'},
      {location: 'westusstage'},
      {location: 'westus2stage'},
      {location: 'asia'},
      {location: 'asiapacific'},
      {location: 'australia'},
      {location: 'brazil'},
      {location: 'canada'},
      {location: 'europe'},
      {location: 'global'},
      {location: 'india'},
      {location: 'japan'},
      {location: 'uk'},
      {location: 'unitedstates'},
      {location: 'eastasiastage'},
      {location: 'southeastasiastage'},
      {location: 'centraluseuap'},
      {location: 'eastus2euap'},
      {location: 'westcentralus'},
      {location: 'westus3'},
      {location: 'southafricawest'},
      {location: 'australiacentral'},
      {location: 'australiacentral2'},
      {location: 'australiasoutheast'},
      {location: 'japanwest'},
      {location: 'koreasouth'},
      {location: 'southindia'},
      {location: 'westindia'},
      {location: 'canadaeast'},
      {location: 'francesouth'},
      {location: 'germanynorth'},
      {location: 'norwaywest'},
      {location: 'switzerlandwest'},
      {location: 'ukwest'},
      {location: 'uaecentral'},
      {location: 'brazilsoutheast'}
    ];
  }

  /**
   * To use EC2 services with the client you need to change the
   * request header because the origin for electron app is of type file
   */
  setFilteringForEc2Calls() {
    // Modify the user agent for all requests to the following urls.
    const filter = {urls: ['https://*.amazonaws.com/']};

    this.session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      details.requestHeaders['Origin'] = 'http://localhost:4200';
      callback({cancel: false, requestHeaders: details.requestHeaders});
    });
  }

  /**
   * Clean the credential file helper
   */
  cleanCredentialFile() {
    try {
      const awsCredentialsPath = this.awsCredentialPath();
      // Rewrite credential file
      this.fs.writeFileSync(awsCredentialsPath, '');
    } catch (e) {
      this.logger(`Can\'t delete aws credential file probably missing: ${e.toString()}`, LoggerLevel.WARN, this, e.stack);
    }
  }

  /**
   * Check if the account is of type AZURE or not
   * @param s - the session containing the account
   */
  isAzure(s) {
    return s.account.subscriptionId !== null && s.account.subscriptionId !== undefined;
  }


  // TODO MOVE TO KEYCHAIN SERVICE
  /**
   * Generate Secret String for keychain
   * @param accountName - account ame we want to use
   * @param user - the user we want to use
   */
  keychainGenerateSecretString(accountName, user) {
    return `${accountName}___${user}___secretKey`;
  }

  /**
   * Generate Access String for keychain
   * @param accountName - account ame we want to use
   * @param user - the user we want to use
   */
  keychainGenerateAccessString(accountName, user) {
    return `${accountName}___${user}___accessKey`;
  }

  stsOptions(session) {
    let options: any = {
      maxRetries: 0,
      httpOptions: {timeout: environment.timeout}
    };

    if (session.account.region) {
      options = {
        ...options,
        endpoint: this.stsEndpointsPerRegion.get(session.account.region),
        region: session.account.region
      };
    }

    return options;
  }

  createRoleSessionName(role) {
    let roleName = `${role}-trusted`;
    roleName = roleName.substr(0, 64).replace(/\//g, '-');
    return roleName;
  }
}
