import { contextMenu } from "./context-menu";
import * as path from "path";
import { environment } from "../src/environments/environment";
import { constants } from "@noovolari/leapp-core/models/constants";
import { startAutoUpdater } from "./auto-updater";

const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const electronLocalshortcut = require('electron-localshortcut');

const url = require("url");
const fs = require("fs");
const os = require("os");
const ipc = ipcMain;

const remote = require("@electron/remote/main");
remote.initialize();

// The build flavor comes from package.json (leappFlavor) unless LEAPP_FLAVOR is set; the renderer
// inherits the variable. Set before anything reads the profile: the app name decides userData, the
// single-instance lock and the log folder, so a dev Leapp never touches an installed prod one.
if (!process.env.LEAPP_FLAVOR) {
  const leappFlavor = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), "package.json"), "utf8")).leappFlavor;
  if (leappFlavor) {
    process.env.LEAPP_FLAVOR = leappFlavor;
  }
}
app.setName(constants.appName);
app.setPath("userData", path.join(app.getPath("appData"), constants.appName));
const deepLinkPrefix = `${constants.urlScheme}://`;

contextMenu({
  showInspectElement: false,
  showLookUpSelection: false,
  showSearchWithGoogle: false
});

app.disableHardwareAcceleration();

if (process.platform === "linux") {
  app.commandLine.appendSwitch("disable-software-rasterizer");
  app.commandLine.appendSwitch("in-process-gpu");
}

app.setAsDefaultProtocolClient(constants.urlScheme);


// Main Window configuration: set here the options to make it works with your app
// Electron is the application wrapper so NOT log is prompted when we build an
// application, we need to log to a file instead
const windowDefaultConfig = {
  dir: path.join(__dirname, `/../../../dist/leapp-client`),
  browserWindow: {
    width: 1200,
    height: 680,
    title: ``,
    icon: path.join(__dirname, `assets/images/Leapp.png`),
    resizable: true,
    webPreferences: {
      devTools: !environment.production,
      contextIsolation: false,
      nodeIntegration: true
    },
  },
};
// Linux keeps the OS window frame with Leapp inside: Electron 22 ignored a hidden title
// bar there, Electron 45 applies it. No titleBarOverlay anywhere: on macOS its controls area (the whole
// 54px top strip) swallows clicks on the command bar.
if (process.platform !== "linux") {
  windowDefaultConfig.browserWindow["titleBarStyle"] = "hidden";
}
if (process.platform === "win32") {
  Menu.setApplicationMenu(null);
}

if (process.platform === "darwin") {
  windowDefaultConfig.browserWindow["trafficLightPosition"] = { x: 20, y: 20 };
}

// Generate the main Electron window
const generateMainWindow = () => {
  if (process.platform === "linux" && ["Pantheon", "Unity:Unity7"].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
    process.env.XDG_CURRENT_DESKTOP = "Unity";
  }

  let win;
  let forceQuit = false;
  let taskbar;
  let trayOpen = false;
  let trayWin;

  const createWindow = () => {
    // Generate the App Window
    win = new BrowserWindow({ ...windowDefaultConfig.browserWindow });
    // This window runs with Node: it must never show anything but the app itself. In-app
    // routes don't navigate; a reload stays under the app folder; links and window.open to anything else are refused.
    const appRoot = url.pathToFileURL(windowDefaultConfig.dir).href + "/";
    win.webContents.on("will-navigate", (event, target) => {
      if (!target.startsWith(appRoot)) {
        event.preventDefault();
      }
    });
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.setMenuBarVisibility(false); // Hide Window Menu to make it compliant with MacOSX
    win.removeMenu(); // Remove Window Menu inside App, to make it compliant with Linux
    win.setMenu(null);
    win.loadURL(url.format({ pathname: windowDefaultConfig.dir + "/index.html", protocol: "file:", slashes: true }));
    win.center();

    // Set new minimum windows for opened tool. Note: it can also be modified at runtime
    win.setMinimumSize(1200, 680);

    // Open the dev tools only if not in production
    if (!environment.production) {
      // Open web tools for diagnostics
      win.webContents.once("dom-ready", () => {});
    }

    win.on("close", (event) => {
      event.preventDefault();
      if (!forceQuit) {
        win.hide();
      } else {
        win.webContents.send("app-close");
      }
    });

    ipc.on("closed", () => {
      win.destroy();
      app.quit();
    });

    ipc.on("resize-window", (evt, data) => {
      // webContents.getOwnerBrowserWindow() was removed in Electron 45
      if (BrowserWindow.fromWebContents(evt.sender)?.id === win.id) {
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
        } else {
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

    app.on("browser-window-focus", () => {
      electronLocalshortcut.register(win, ['CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5'], () => {});
    });

    app.on("browser-window-focus", () => {
      electronLocalshortcut.register(win, ['CommandOrControl+A'], () => {
        win.webContents.send("select-all");
      });
    });

    app.on("browser-window-blur", () => {
      electronLocalshortcut.unregisterAll(win);
    });

    // On macOS the deep link is correctly retrieved from the event, and because
    // we are in the ready action the ipc can correctly send the url to the frontend
    app.on('open-url', (event, url) => {
      event.preventDefault();
      win.webContents.send("PLUGIN_URL", url);
    });

    remote.enable(win.webContents);

    // Protocol handler for win32 and linux for deep linking when the app is already launched.
    // The url is passed in the args so we read and write to a temp file before the frontend is
    // launched, this way the frontend can read the temp file and load the plugin
    if (process.platform !== 'darwin' && process.argv[1] && process.argv[1].split(deepLinkPrefix)[1]) {
      // Keep only command line / deep linked arguments
      fs.writeFileSync(path.join(os.homedir(), constants.deeplinkFile), process.argv[1].split(deepLinkPrefix)[1]);
    }
  };

  const createTrayWindow = () => {
    // Generate the App Window
    const opts = { ...windowDefaultConfig.browserWindow, frame: false };
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

    const taskbarWidth = 362;
    const taskbarHeight = 480;

    // Set position of taskbar
    // Need to be modified to accommodate for various scenarios
    trayWin.setPosition(taskbar.getBounds().x - taskbarWidth + taskbar.getBounds().width, taskbar.getBounds().y + taskbar.getBounds().height);

    // Set new minimum windows for opened tool.
    trayWin.setMinimumSize(taskbarWidth, taskbarHeight);
    trayWin.setSize(taskbarWidth, taskbarHeight);

    // Open the dev tools only if not in production
    if (!environment.production) {
      // Open web tools for diagnostics
      trayWin.webContents.once("dom-ready", () => {});
    }

    remote.enable(trayWin.webContents);
  };

  const createTray = () => {
    if (!taskbar) {
      taskbar = new Tray(windowDefaultConfig.dir + `/assets/images/LeappTemplate.png`);
      taskbar.setToolTip(constants.productName);
      taskbar.on("click", () => {
        trayOpen = !trayOpen;
        if (trayOpen) {
          // open
          createTrayWindow();
        } else {
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

  app.on("activate", () => {
    if (win === undefined) {
      createWindow();
    } else {
      win.show();
    }
  });

  app.on("before-quit", () => {
    forceQuit = true;
  });

  app.on("ready", () => {
    createWindow();
    // Update check (prod flavor; dev and qa only with LEAPP_UPDATE_FEED_URL)
    startAutoUpdater(() => win);
    // createTray();

  });

  // when the app on macOS is starting for the first time the frontend is not ready so we use 'will-finish-launching'
  // to encapsulate open-url callback and we write to a temp file because here the frontend is not ready yet.
  app.on("will-finish-launching", () => {
    app.on('open-url', (event, url) => {
      event.preventDefault();
      try {
        fs.writeFileSync(path.join(os.homedir(), constants.deeplinkFile), url);
      } catch(err) {
        console.log(err);
      }
    });
  });

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", (event, argv, _workingDirectory) => {
      // For Win32 and Linux we can read the deep link from the second instance args and write
      // to file before the second instance is removed by the first instance lock
      if (process.platform !== 'darwin') {
        // Keep only command line / deep linked arguments
        if (win) {
          // Win32 and Linux on app already open
          if(argv.length > 0) {
            if(argv[argv.length-1] && argv[argv.length-1]?.split(deepLinkPrefix)[1]) {
              win.webContents.send("PLUGIN_URL", argv[argv.length-1]?.split(deepLinkPrefix)[1]);
            }
          }
          win.focus();
        }
      }
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) {
          win.restore();
        }
        win.show();
        win.focus();
      }
    });
  }
  if (process.platform === "win32") {
    app.setAppUserModelId(constants.appName);
  }
};
// =============================== //
// Start the real application HERE //
// =============================== //
generateMainWindow();
