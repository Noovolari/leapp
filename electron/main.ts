import * as path from 'path';
import {environment} from '../src/environments/environment';
import * as CryptoJS from 'crypto-js';
import {initialConfiguration} from '../src/app/core/initial-configuration';
import {machineIdSync} from 'node-machine-id';
import {Workspace} from '../src/app/models/workspace';

const {app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron');
const url = require('url');
const fs = require('fs');
const os = require('os');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const ipc = ipcMain;

// Fix for warning at startup
app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();

// Main Window configuration: set here tyhe options to make it works with your app
// Electron is the application wrapper so NOT log is prompted when we build an
// application, we need to log to a file instead
const windowDefaultConfig = {
  dir: path.join(__dirname, `/../../../dist/leapp-client`),
  browserWindow: {
    width: 430,
    height: 600,
    title: ``,
    icon: path.join(__dirname, `assets/images/Leapp.png`),
    resizable: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      devTools: !environment.production,
      worldSafeExecuteJavaScript: true,

      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
  }
};

// Define the workspace directory from config file in *src/environments*
// Define the aws credentials path from config file in *src/environments*
const workspacePath = os.homedir() + '/' + environment.lockFileDestination;
const awsCredentialsPath = os.homedir() + '/' + environment.credentialsDestination;

const buildAutoUpdater = (win: any): void => {
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoDownload = false;

  const minutes = 10;

  autoUpdater.checkForUpdates();
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 1000 * 60 * minutes);

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('UPDATE_AVAILABLE', info);
  });
};

// Generate the main Electron window
const generateMainWindow = () => {
  let win;
  let forceQuit = false;

  const createWindow = () => {
    // Generate the App Window
    win = new BrowserWindow({...windowDefaultConfig.browserWindow});
    win.setMenuBarVisibility(false); // Hide Window Menu to make it compliant with MacOSX
    win.removeMenu(); // Remove Window Menu inside App, to make it compliant with Linux
    win.setMenu(null);
    win.loadURL(url.format({ pathname: windowDefaultConfig.dir + '/index.html', protocol: 'file:', slashes: true }));
    win.center();

    // Open the dev tools only if not in production
    if (!environment.production) {
      // Open web tools for diagnostics
      win.webContents.once('dom-ready', () => {});
    }

    win.on('close', (event) => {
      event.preventDefault();
      if (!forceQuit) {
        win.hide();
      } else {
        win.webContents.send('app-close');
      }
    });

    ipc.on('closed', () => {
      win.destroy();
      app.quit();
    });

    app.on('browser-window-focus', () => {
      globalShortcut.register('CommandOrControl+R', () => {
        console.log('CommandOrControl+R is pressed: Shortcut Disabled');
      });
      globalShortcut.register('F5', () => {
        console.log('F5 is pressed: Shortcut Disabled');
      });
    });

    app.on('browser-window-blur', () => {
      globalShortcut.unregister('CommandOrControl+R');
      globalShortcut.unregister('F5');
    });
  };

  app.on('activate', () => {
    if (win === null || win === undefined) {
      createWindow();
    } else {
      win.show();
    }
  });

  app.on('before-quit', () => {
    forceQuit = true;
  });

  app.on('ready', () => {
    createWindow();
    buildAutoUpdater(win);
  });

  let loginCount = 0;

  app.on('login', (event, webContents, request, authInfo, callback) => {
    try {
      const file = fs.readFileSync(workspacePath, {encoding: 'utf-8'});
      const decriptedFile = CryptoJS.AES.decrypt(file, machineIdSync());
      const fileExists = fs.existsSync(workspacePath);

      let workspace = fileExists ? JSON.parse(decriptedFile).toString(CryptoJS.enc.Utf8) : undefined;
      if (workspace !== undefined && workspace.workspaces[0] !== undefined) {
        workspace = (workspace.workspaces[0] as Workspace);

        if (workspace.proxyConfiguration !== undefined &&
          workspace.proxyConfiguration !== null &&
          workspace.proxyConfiguration.username &&
          workspace.proxyConfiguration.password) {

          if (loginCount === 0) {
            loginCount++;

            const tempInfo = Object.assign({}, workspace.proxyConfiguration);
            tempInfo.password = '******';

            log.info(`we are inside app login with auth: ${JSON.stringify(tempInfo, null, 3)}`);
            const proxyUsername = workspace.proxyConfiguration.username;
            const proxyPassword = workspace.proxyConfiguration.password;
            // Supply credentials to server
            callback(proxyUsername, proxyPassword);
          } else {
            log.error('[electron main] Proxy Auth Credentials invalid');
            return;
          }
        }
      }
    } catch (err) {}
  });

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) { win.restore(); }
        win.focus();
      }
    });
  }
};

// Prepare and generate the main window if everything is setupped correctly
const initWorkspace = () => {
  // Remove unused voices from contextual menu
  const template = [
    {
      label: 'Leapp',
      submenu: [
        { label: 'About',  role: 'about' },
        { label: 'Quit',  role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' }
      ]
    }
  ];
  if (!environment.production) {
    template[0].submenu.push({ label: 'Open DevTool', role: 'toggledevtools' });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  if (process.platform === 'linux' && ['Pantheon', 'Unity:Unity7'].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
    process.env.XDG_CURRENT_DESKTOP = 'Unity';
  }

  const workspace = fs.existsSync(workspacePath) ? JSON.parse(CryptoJS.AES.decrypt(fs.readFileSync(workspacePath, {encoding: 'utf-8'}), machineIdSync()).toString(CryptoJS.enc.Utf8)) : undefined;
  if (workspace === undefined) {
    // Setup your first workspace and then run createWindow
    log.info('Setupping workspace for the first time');
    setupWorkspace();
  } else {
    // Generate the main window
    generateMainWindow();
  }
};

// Setup the first workspace in order to define the .Leapp directory and the .aws one
const setupWorkspace = () => {
  try {
    // Generate .Leapp and .aws directories for future works
    fs.mkdirSync(os.homedir() + '/.Leapp');
    fs.mkdirSync(os.homedir() + '/.aws');
  } catch (err) {
    log.warn('directory leapp or aws already exist');
  } finally {
    try {
      // If it is the first time and there's a file, let's backup the file
      if (!fs.existsSync(workspacePath) && fs.existsSync(awsCredentialsPath) && !fs.existsSync(awsCredentialsPath + '.leapp.bkp')) {
        fs.renameSync(awsCredentialsPath, awsCredentialsPath + '.leapp.bkp');
      }

      // Write workspace file
      fs.writeFileSync(workspacePath, CryptoJS.AES.encrypt(JSON.stringify(initialConfiguration, null, 2), machineIdSync()).toString());

      // Write credential file
      fs.writeFileSync(awsCredentialsPath, '');
    } catch (e) {
      log.error(e);
      app.exit(0);
    }

    // Launch initWorkspace again, now it will be loaded correctly because the file and directories are there
    initWorkspace();
  }
};

// =============================== //
// Start the real application HERE //
// =============================== //
initWorkspace();
