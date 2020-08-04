import * as path from 'path';
import {environment} from '../src/environments/environment';
import * as CryptoJS from 'crypto-js';
import {aesPassword} from '../src/app/core/enc';
import {initialConfiguration} from '../src/app/core/initial-configuration';

const {app, BrowserWindow} = require('electron');
const url = require('url');
const copydir = require('copy-dir');
const fs = require('fs');
const os = require('os');
const log = require('electron-log');
const exec = require('child_process').exec;
const {autoUpdater} = require('electron-updater');
const ipc = require('electron').ipcMain;

// Fix for warning at startup
app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();

// Main Window configuration: set here tyhe options to make it works with your app
// Electron is the application wrapper so NOT log is prompted when we build an
// application, we need to log to a file instead
const windowDefaultConfig = {
  dir: path.join(__dirname, `/../../../dist/noovolari-eddie-client`),
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
        fs.writeFileSync(workspacePath, CryptoJS.AES.encrypt(JSON.stringify(initialConfiguration, null, 2), aesPassword()).toString());
        // Write credential file
        fs.writeFileSync(awsCredentialsPath, '');
      } catch (e) {
        log.error(e);
        app.exit(0);
      }

      // Launch initWorkspace again, now it will beloaded correctly because the file and directories are there
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

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
  });
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
  });
  autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ' + err);
  });
  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = 'Download speed: ' + progressObj.bytesPerSecond;
    logMessage = logMessage + ' - Downloaded ' + progressObj.percent + '%';
    logMessage = logMessage + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
    log.info(logMessage);
  });
  autoUpdater.on('update-downloaded', (ev, info) => {
    // Wait 5 seconds, then quit and install
    // In your application, you don't need to wait 5 seconds.
    // You could call autoUpdater.quitAndInstall(); immediately
    log.info('Update downloaded');
    autoUpdater.quitAndInstall();
  });

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
    autoUpdater.checkForUpdatesAndNotify();
    createWindow();
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

  const workspace = fs.existsSync(workspacePath) ? JSON.parse(CryptoJS.AES.decrypt(fs.readFileSync(workspacePath, {encoding: 'utf-8'}), aesPassword()).toString(CryptoJS.enc.Utf8)) : undefined;

  if (workspace === undefined) {
    // Setup your first workspace and then run createWindow
    log.info('Setupping workspace for the first time');
    setupWorkspace();
  } else {
    // Generate the main window
    generateMainWindow();
  }
};

// =============================== //
// Start the real application HERE //
// =============================== //
initWorkspace();
