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
      this.fs = (window as any).fs;
      this.rimraf = (window as any).rimraf;
      this.ini = (window as any).ini;
      this.url = (window as any).url;
      this.copydir = (window as any).copydir;
      this.os = (window as any).os;
      this.unzip = (window as any).unzip;
      this.exec = (window as any).exec;
      this.sudo = (window as any).sudo;
      this.md5File = (window as any).md5File;
      this.path = (window as any).path;
      this.semver = (window as any).semver;
      this.shell = (window as any).shell;
      this.machineId = (window as any).MachineId;
      this.process = (window as any).process;
      this.ipcRenderer = (window as any).ipcRenderer;
      this.keytar = (window as any).keytar;
      this.followRedirects = (window as any).followRedirects;
      this.httpProxyAgent = (window as any).httpProxyAgent;
      this.httpsProxyAgent = (window as any).httpsProxyAgent;

      this.log = (window as any).log;
      this.app = (window as any).app;
      this.session = (window as any).session;
      this.dialog = (window as any).dialog;
      this.browserWindow = (window as any).BrowserWindow;
      this.currentWindow = (window as any).currentWindow;
      this.menu = (window as any).Menu;
      this.tray = (window as any).Tray;
      this.ipcRenderer = (window as any).ipcRenderer;
    }
  }

}
