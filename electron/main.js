"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var path = require("path");
var environment_1 = require("../src/environments/environment");
var remote = require('@electron/remote/main');
remote.initialize();
var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, globalShortcut = _a.globalShortcut, ipcMain = _a.ipcMain;
var autoUpdater = require('electron-updater').autoUpdater;
var url = require('url');
var ipc = ipcMain;
// Fix for warning at startup
app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();
// Main Window configuration: set here the options to make it works with your app
// Electron is the application wrapper so NOT log is prompted when we build an
// application, we need to log to a file instead
var windowDefaultConfig = {
    dir: path.join(__dirname, "/../../../dist/leapp-client"),
    browserWindow: {
        width: 514,
        height: 650,
        title: "",
        icon: path.join(__dirname, "assets/images/Leapp.png"),
        resizable: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            devTools: !environment_1.environment.production,
            worldSafeExecuteJavaScript: true,
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true
        }
    }
};
var buildAutoUpdater = function (win) {
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.autoDownload = false;
    var minutes = 10;
    var data = {
        provider: 'generic',
        url: 'https://asset.noovolari.com/latest',
        channel: 'latest'
    };
    autoUpdater.setFeedURL(data);
    autoUpdater.checkForUpdates();
    setInterval(function () {
        autoUpdater.checkForUpdates();
    }, 1000 * 60 * minutes);
    autoUpdater.on('update-available', function (info) {
        win.webContents.send('UPDATE_AVAILABLE', info);
    });
};
// Generate the main Electron window
var generateMainWindow = function () {
    if (process.platform === 'linux' && ['Pantheon', 'Unity:Unity7'].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
        process.env.XDG_CURRENT_DESKTOP = 'Unity';
    }
    var win;
    var forceQuit = false;
    var createWindow = function () {
        // Generate the App Window
        win = new BrowserWindow(__assign({}, windowDefaultConfig.browserWindow));
        win.setMenuBarVisibility(false); // Hide Window Menu to make it compliant with MacOSX
        win.removeMenu(); // Remove Window Menu inside App, to make it compliant with Linux
        win.setMenu(null);
        win.loadURL(url.format({ pathname: windowDefaultConfig.dir + '/index.html', protocol: 'file:', slashes: true }));
        win.center();
        // Open the dev tools only if not in production
        if (!environment_1.environment.production) {
            // Open web tools for diagnostics
            win.webContents.once('dom-ready', function () { });
        }
        win.on('close', function (event) {
            event.preventDefault();
            if (!forceQuit) {
                win.hide();
            }
            else {
                win.webContents.send('app-close');
            }
        });
        ipc.on('closed', function () {
            win.destroy();
            app.quit();
        });
        app.on('browser-window-focus', function () {
            globalShortcut.register('CommandOrControl+R', function () {
                console.log('CommandOrControl+R is pressed: Shortcut Disabled');
            });
            globalShortcut.register('F5', function () {
                console.log('F5 is pressed: Shortcut Disabled');
            });
        });
        app.on('browser-window-blur', function () {
            globalShortcut.unregister('CommandOrControl+R');
            globalShortcut.unregister('F5');
        });
    };
    app.on('activate', function () {
        if (win === undefined) {
            createWindow();
        }
        else {
            win.show();
        }
    });
    app.on('before-quit', function () {
        forceQuit = true;
    });
    app.on('ready', function () {
        createWindow();
        buildAutoUpdater(win);
    });
    var gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    }
    else {
        app.on('second-instance', function (event, commandLine, workingDirectory) {
            // Someone tried to run a second instance, we should focus our window.
            if (win) {
                if (win.isMinimized()) {
                    win.restore();
                }
                win.focus();
            }
        });
    }
};
// =============================== //
// Start the real application HERE //
// =============================== //
generateMainWindow();
