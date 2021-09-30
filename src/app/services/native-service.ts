/*
* Everytime you need to add a new native service from a node.js module the procedure is:
* - do the normal npm install from the IntelliJ terminal from the root of your project
* - add the require in the main index.html file pointing to a window object of your choice e.g. window.mylib; use the already added libraries as reference
* - create an entry in this file; now through native service you can inject that library everywhere in the angular code!
*/
import * as Keytar from 'keytar';

export class NativeService {
  protected url: any;
  protected log: any;
  protected fs: any;
  protected rimraf: any;
  protected os: any;
  protected ini: any;
  protected app: any;
  protected dialog: any;
  protected exec: any;
  protected session: any;
  protected unzip: any;
  protected copydir: any;
  protected browserWindow: any;
  protected sudo: any;
  protected md5File: any;
  protected path: any;
  protected currentWindow: any;
  protected semver: any;
  protected shell: any;
  protected menu: any;
  protected tray: any;
  protected machineId: any;
  protected ipcRenderer: any;
  protected keytar: typeof Keytar;
  protected followRedirects: any;
  protected httpProxyAgent: any;
  protected httpsProxyAgent: any;
  protected nativeTheme: any;
  protected notification: any;

  protected process: any;

  get isElectron(): boolean {
    return !!(window && window.process && (window.process as any).type);
  }

  constructor() {
    if (this.isElectron) {
      this.log = window.require('electron-log');
      this.fs = window.require('fs-extra');
      this.rimraf = window.require('rimraf');
      this.os = window.require('os');
      this.ini = window.require('ini');
      this.md5File = window.require('md5-file');
      this.path = window.require('path');
      this.exec = window.require('child_process').exec;
      this.url = window.require('url');
      this.unzip = window.require('extract-zip');
      this.copydir = window.require('copy-dir');
      this.sudo = window.require('sudo-prompt');
      this.semver = window.require('semver');
      this.shell = window.require('electron').shell;
      this.machineId = window.require('node-machine-id').machineIdSync();
      this.keytar = window.require('keytar');
      this.followRedirects = window.require('follow-redirects');
      this.httpProxyAgent = window.require('http-proxy-agent');
      this.httpsProxyAgent = window.require('https-proxy-agent');
      this.app = window.require('@electron/remote').app;
      this.session = window.require('@electron/remote').session;
      this.dialog = window.require('@electron/remote').dialog;
      this.browserWindow = window.require('@electron/remote').BrowserWindow;
      this.currentWindow = window.require('@electron/remote').getCurrentWindow();
      this.menu = window.require('@electron/remote').Menu;
      this.tray = window.require('@electron/remote').Tray;
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.nativeTheme = window.require('@electron/remote').nativeTheme;
      this.notification = window.require('@electron/remote').Notification;
      this.process = (window as any).process;

    }
  }
}
