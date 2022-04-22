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
var _a = require("electron"), app = _a.app, BrowserWindow = _a.BrowserWindow, globalShortcut = _a.globalShortcut, ipcMain = _a.ipcMain, Tray = _a.Tray, Menu = _a.Menu;
var autoUpdater = require("electron-updater").autoUpdater;
var url = require("url");
var ipc = ipcMain;
var remote = require("@electron/remote/main");
remote.initialize();
// Fix for warning at startup
app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();
// Main Window configuration: set here the options to make it works with your app
// Electron is the application wrapper so NOT log is prompted when we build an
// application, we need to log to a file instead
var windowDefaultConfig = {
    dir: path.join(__dirname, "/../../../dist/leapp-client"),
    browserWindow: {
        width: 1200,
        height: 680,
        title: "",
        icon: path.join(__dirname, "assets/images/Leapp.png"),
        resizable: true,
        webPreferences: {
            devTools: !environment_1.environment.production,
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true
        }
    }
};
if (process.platform !== "win32") {
    windowDefaultConfig.browserWindow["titleBarStyle"] = "hidden";
    windowDefaultConfig.browserWindow["titleBarOverlay"] = true;
}
else {
    windowDefaultConfig.browserWindow["titleBarStyle"] = "hidden";
    Menu.setApplicationMenu(null);
}
if (process.platform === "darwin") {
    windowDefaultConfig.browserWindow["trafficLightPosition"] = { x: 20, y: 20 };
}
var buildAutoUpdater = function (win) {
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.autoDownload = false;
    var minutes = 10;
    var data = {
        provider: "generic",
        url: "https://asset.noovolari.com/latest",
        channel: "latest"
    };
    autoUpdater.setFeedURL(data);
    autoUpdater.checkForUpdates().then(function (_) { });
    setInterval(function () {
        autoUpdater.checkForUpdates().then(function (_) { });
    }, 1000 * 60 * minutes);
    autoUpdater.on("update-available", function (info) {
        win.webContents.send("UPDATE_AVAILABLE", info);
    });
};
// Generate the main Electron window
var generateMainWindow = function () {
    if (process.platform === "linux" && ["Pantheon", "Unity:Unity7"].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
        process.env.XDG_CURRENT_DESKTOP = "Unity";
    }
    var win;
    var forceQuit = false;
    var taskbar;
    var trayOpen = false;
    var trayWin;
    var createWindow = function () {
        // Generate the App Window
        win = new BrowserWindow(__assign({}, windowDefaultConfig.browserWindow));
        win.setMenuBarVisibility(false); // Hide Window Menu to make it compliant with MacOSX
        win.removeMenu(); // Remove Window Menu inside App, to make it compliant with Linux
        win.setMenu(null);
        win.loadURL(url.format({ pathname: windowDefaultConfig.dir + "/index.html", protocol: "file:", slashes: true }));
        win.center();
        // Set new minimum windows for opened tool. Note: it can also be modified at runtime
        win.setMinimumSize(1200, 680);
        // Open the dev tools only if not in production
        if (!environment_1.environment.production) {
            // Open web tools for diagnostics
            win.webContents.once("dom-ready", function () { });
        }
        win.on("close", function (event) {
            event.preventDefault();
            if (!forceQuit) {
                win.hide();
            }
            else {
                win.webContents.send("app-close");
            }
        });
        ipc.on("closed", function () {
            win.destroy();
            app.quit();
        });
        ipc.on("resize-window", function (evt, data) {
            if (evt.sender.getOwnerBrowserWindow().id === win.id) {
                if (data.compactMode) {
                    // Double setSize/setMinimumSize here is to address a strange behavior between mac and windows,
                    // where the first is used by windows and the last by mac. If we don't put either the first or the last
                    // couple the behaviour is not consistent.
                    win.setMinimumSize(560, 680);
                    win.setSize(560, 680);
                    win.setResizable(false);
                    win.setMaximizable(false);
                    win.setFullScreenable(false);
                    win.setMinimumSize(560, 680);
                    win.setSize(560, 680);
                }
                else {
                    win.setMinimumSize(1200, 680);
                    win.setSize(1200, 680);
                    win.setResizable(true);
                    win.setMaximizable(true);
                    win.setFullScreenable(true);
                    win.setMinimumSize(1200, 680);
                    win.setSize(1200, 680);
                }
            }
        });
        app.on("browser-window-focus", function () {
            globalShortcut.register("CommandOrControl+R", function () {
                console.log("CommandOrControl+R is pressed: Shortcut Disabled");
            });
            globalShortcut.register("F5", function () {
                console.log("F5 is pressed: Shortcut Disabled");
            });
        });
        app.on("browser-window-blur", function () {
            globalShortcut.unregister("CommandOrControl+R");
            globalShortcut.unregister("F5");
        });
        remote.enable(win.webContents);
    };
    var createTrayWindow = function () {
        // Generate the App Window
        var opts = __assign(__assign({}, windowDefaultConfig.browserWindow), { frame: false });
        opts["titleBarStyle"] = "CustomOnHover";
        opts["titleBarOverlay"] = true;
        opts["minimizable"] = false;
        opts["maximizable"] = false;
        opts["closable"] = false;
        trayWin = new BrowserWindow(opts);
        trayWin.setMenuBarVisibility(false); // Hide Window Menu to make it compliant with MacOSX
        trayWin.removeMenu(); // Remove Window Menu inside App, to make it compliant with Linux
        trayWin.setMenu(null);
        trayWin.loadURL(url.format({ pathname: windowDefaultConfig.dir + "/index.html", protocol: "file:", slashes: true }));
        var taskbarWidth = 362;
        var taskbarHeight = 480;
        // Set position of taskbar
        // Need to be modified to accommodate for various scenarios
        trayWin.setPosition(taskbar.getBounds().x - taskbarWidth + taskbar.getBounds().width, taskbar.getBounds().y + taskbar.getBounds().height);
        // Set new minimum windows for opened tool.
        trayWin.setMinimumSize(taskbarWidth, taskbarHeight);
        trayWin.setSize(taskbarWidth, taskbarHeight);
        // Open the dev tools only if not in production
        if (!environment_1.environment.production) {
            // Open web tools for diagnostics
            trayWin.webContents.once("dom-ready", function () { });
        }
        remote.enable(trayWin.webContents);
    };
    var createTray = function () {
        if (!taskbar) {
            taskbar = new Tray(windowDefaultConfig.dir + "/assets/images/LeappTemplate.png");
            taskbar.setToolTip("Leapp");
            taskbar.on("click", function () {
                trayOpen = !trayOpen;
                if (trayOpen) {
                    // open
                    createTrayWindow();
                }
                else {
                    // close
                    if (trayWin) {
                        trayWin.setClosable(true);
                        trayWin.close();
                        trayWin = null;
                    }
                }
            });
        }
    };
    app.on("activate", function () {
        if (win === undefined) {
            createWindow();
            require("electron-disable-file-drop");
        }
        else {
            win.show();
        }
    });
    app.on("before-quit", function () {
        forceQuit = true;
    });
    app.on("ready", function () {
        createWindow();
        // createTray();
        buildAutoUpdater(win);
    });
    var gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    }
    else {
        app.on("second-instance", function (event, commandLine, workingDirectory) {
            // Someone tried to run a second instance, we should focus our window.
            if (win) {
                if (win.isMinimized()) {
                    win.restore();
                }
                win.focus();
            }
        });
    }
    if (process.platform === "win32") {
        app.setAppUserModelId("Leapp");
    }
};
// =============================== //
// Start the real application HERE //
// =============================== //
generateMainWindow();
