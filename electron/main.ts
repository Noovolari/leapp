import * as path from 'path';
import {environment} from '../src/environments/environment';
import * as CryptoJS from 'crypto-js';
import {initialConfiguration} from '../src/app/core/initial-configuration';
import {machineIdSync} from 'node-machine-id';
import {Workspace} from '../src/app/models/workspace';

const {app, BrowserWindow} = require('electron');
const url = require('url');
const copydir = require('copy-dir');
const fs = require('fs');
const os = require('os');
const log = require('electron-log');
const exec = require('child_process').exec;
const ipc = require('electron').ipcMain;

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
      nodeIntegration: true
    }
  }
};

// Define the workspace directory from config file in *src/environments*
// Define the aws credentials path from config file in *src/environments*
const workspacePath = os.homedir() + '/' + environment.lockFileDestination;
const awsCredentialsPath = os.homedir() + '/' + environment.credentialsDestination;

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

        // If it is the first time, let's backup the file
        if (!fs.existsSync(workspacePath) && fs.existsSync(awsCredentialsPath)) {
          fs.renameSync(awsCredentialsPath, awsCredentialsPath + '.bkp');
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
    require('update-electron-app')();
  });

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
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

  if (process.platform === 'linux' && ['Pantheon', 'Unity:Unity7'].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
    process.env.XDG_CURRENT_DESKTOP = 'Unity';
  }

  const workspace = fs.existsSync(workspacePath) ? JSON.parse(CryptoJS.AES.decrypt(fs.readFileSync(workspacePath, {encoding: 'utf-8'}), machineIdSync()).toString(CryptoJS.enc.Utf8)) : undefined;
  if (workspace === undefined) {
    // Setup your first workspace and then run createWindow
    log.info('Setupping workspace for the first time');
    setupWorkspace();
  } else {
    // Check and activate proxy pass if necessary
    if (workspace.workspaces[0] !== undefined && (workspace.workspaces[0] as Workspace).proxyUrl) {
      console.log('workspace in main, check proxy url:', workspace);
      process.env.HTTP_PROXY = (workspace.workspaces[0] as Workspace).proxyUrl;
      const globalTunnel = require('global-tunnel');
      globalTunnel.initialize();
    }
    // Generate the main window
    generateMainWindow();
  }
};

// =============================== //
// Start the real application HERE //
// =============================== //
initWorkspace();
