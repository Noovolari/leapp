import * as path from 'path';
import {environment} from '../src/environments/environment';

const {app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const url = require('url');
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
    width: 514,
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

// Generate the main Electron window
const generateMainWindow = () => {
  if (process.platform === 'linux' && ['Pantheon', 'Unity:Unity7'].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
    process.env.XDG_CURRENT_DESKTOP = 'Unity';
  }

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
    if (win === undefined) {
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

// =============================== //
// Start the real application HERE //
// =============================== //
generateMainWindow();
