/*
* Everytime you need to add a new native service from a node.js module the procedure is:
* - do the normal npm install from the IntelliJ terminal from the root of your project
* - add the require in the main index.html file pointing to a window object of your choice e.g. window.mylib; use the already added libraries as reference
* - create an entry in this file; now through native service you can inject that library everywhere in the angular code!
*/
import * as Keytar from 'keytar';


export class NativeService {
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
  public url: any;
  protected currentWindow: any;
  protected semver: any;
  protected shell: any;
  protected menu: any;
  protected tray: any;
  protected machineId: any;
  protected process: any;
  protected ipcRenderer: any;
  protected keytar: typeof Keytar;
  protected followRedirects: any;
  protected httpProxyAgent: any;
  protected httpsProxyAgent: any;

  constructor() {
    if ((window as any)) {

      this.fs = (window as any).native.fs;
      this.rimraf = (window as any).native.rimraf;
      this.ini = (window as any).native.ini;
      this.url = (window as any).native.url;
      this.copydir = (window as any).native.copydir;
      this.os = (window as any).native.os;
      this.unzip = (window as any).native.unzip;
      this.exec = (window as any).native.exec;
      this.sudo = (window as any).native.sudo;
      this.md5File = (window as any).native.md5File;
      this.path = (window as any).native.path;
      this.semver = (window as any).native.semver;
      this.shell = (window as any).native.shell;
      this.machineId = (window as any).native.MachineId;
      this.process = (window as any).native.process;
      this.ipcRenderer = (window as any).native.ipcRenderer;
      this.keytar = (window as any).native.keytar;
      this.followRedirects = (window as any).native.followRedirects;
      this.httpProxyAgent = (window as any).native.httpProxyAgent;
      this.httpsProxyAgent = (window as any).native.httpsProxyAgent;

      this.log = (window as any).native.log;
      this.app = (window as any).native.app;
      this.session = (window as any).native.session;
      this.dialog = (window as any).native.dialog;
      this.browserWindow = (window as any).native.BrowserWindow;
      this.currentWindow = (window as any).native.currentWindow;
      this.menu = (window as any).native.Menu;
      this.tray = (window as any).native.Tray;
      this.ipcRenderer = (window as any).native.ipcRenderer;
    }
  }

}
