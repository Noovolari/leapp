import { contextMenu } from "./context-menu";
import * as path from "path";
import { environment } from "../src/environments/environment";
import * as https from "https";
import * as http from "http";
import { execFile as child } from "child_process";

const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require("electron");
const electronLocalshortcut = require('electron-localshortcut');
const { autoUpdater } = require("electron-updater");
const findProcess = require("find-process");

const url = require("url");
const fs = require("fs");
const os = require("os");
const ipc = ipcMain;

const remote = require("@electron/remote/main");
remote.initialize();

async function download(url, filePath) {
  const proto = !url.charAt(4).localeCompare('s') ? https : http;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    let fileInfo = null;

    const request = proto.get(url, response => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        });
        return;
      }

      fileInfo = {
        mime: response.headers['content-type'],
        size: parseInt(response.headers['content-length'], 10),
      };

      response.pipe(file);
    });

    // The destination stream is ended by the time it's called
    file.on('finish', () => resolve(fileInfo));

    request.on('error', err => {
      fs.unlink(filePath, () => reject(err));
    });

    file.on('error', err => {
      fs.unlink(filePath, () => reject(err));
    });

    request.end();
  });
}

contextMenu({
  showInspectElement: false,
  showLookUpSelection: false,
  showSearchWithGoogle: false
});

// Fix for warning at startup
app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();

if (process.platform === "linux") {
  app.commandLine.appendSwitch("disable-software-rasterizer");
  app.commandLine.appendSwitch("in-process-gpu");
}

app.setAsDefaultProtocolClient('leapp');


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
      enableRemoteModule: true,
      nodeIntegration: true
    },
  },
};
if (process.platform !== "win32") {
  windowDefaultConfig.browserWindow["titleBarStyle"] = "hidden";
  windowDefaultConfig.browserWindow["titleBarOverlay"] = true;
} else {
  windowDefaultConfig.browserWindow["titleBarStyle"] = "hidden";
  Menu.setApplicationMenu(null);
}

if (process.platform === "darwin") {
  windowDefaultConfig.browserWindow["trafficLightPosition"] = { x: 20, y: 20 };
}

const buildAutoUpdater = (win: any): void => {
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoDownload = false;

  const minutes = 1;

  const data = {
    provider: "generic",
    url: "http://localhost:8000/", //"https://asset.noovolari.com/latest",
    channel: "latest",
  };
  autoUpdater.setFeedURL(data);

  autoUpdater.checkForUpdates().then((_) => {});
  //autoUpdater.checkForUpdates().then((_) => {});
  // setInterval(() => {
  //   autoUpdater.checkForUpdates().then((_) => {});
  // }, 1000 * 60 * minutes);

  // Ref here: https://www.electronjs.org/docs/latest/api/auto-updater
  autoUpdater.on("update-available", (info) => {
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Download update', 'Skip'],
      defaultId: 0,
      message: 'update-available event'
    }).then(async (selection) => {
      if (selection.response === 0) {
        console.log("update available log by console: ", info);
        autoUpdater.downloadUpdate().catch(error => console.error(error));
      }
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Install and Restart', 'Later'],
      defaultId: 0,
      message: 'A new update has been downloaded. Would you like to install and restart the app now?'
    }).then(async (selection) => {
      if (selection.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
};

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

    ipc.handle("make-update", async () => {
      await autoUpdater.downloadUpdate();
      autoUpdater.quitAndInstall(true, true);
    });

    ipc.on("closed", () => {
      win.destroy();
      app.quit();
    });

    ipc.on("resize-window", (evt, data) => {
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
    if (process.platform !== 'darwin' && process.argv[1] && process.argv[1].split("leapp://")[1]) {
      // Keep only command line / deep linked arguments
      fs.writeFileSync(path.join(os.homedir(), environment.deeplinkFile), process.argv[1].split("leapp://")[1]);
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
      taskbar.setToolTip("Leapp");
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
      require("electron-disable-file-drop");
    } else {
      win.show();
    }
  });

  app.on("before-quit", () => {
    forceQuit = true;
  });

  app.on("ready", async () => {
    createWindow();
    // createTray();

    while(autoUpdater.isUpdaterActive()) {
      // do nothing
    }

    /*
    let isShipItStillRunning = true;
    let shouldRestartBeforeLaunch = false;

    while (isShipItStillRunning) {
      const shipItProcesses = await findProcess("name", "ShipIt");
      if (shipItProcesses.some(f => f.cmd.includes("com.leapp.app"))) {
        // if we don't restart, the old app from memory will keep running
        shouldRestartBeforeLaunch = true;
        console.debug("Waiting for auto update to finish");
      } else {
        isShipItStillRunning = false;
      }
    }

    if (shouldRestartBeforeLaunch) {
      app.relaunch();
      app.exit(0);
    }*/

    buildAutoUpdater(win);
  });

  // when the app on macOS is starting for the first time the frontend is not ready so we use 'will-finish-launching'
  // to encapsulate open-url callback and we write to a temp file because here the frontend is not ready yet.
  app.on("will-finish-launching", () => {
    app.on('open-url', (event, url) => {
      event.preventDefault();
      try {
        fs.writeFileSync(path.join(os.homedir(), environment.deeplinkFile), url);
      } catch (err) {
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
          if (argv.length > 0) {
            if (argv[argv.length - 1] && argv[argv.length - 1]?.split("leapp://")[1]) {
              win.webContents.send("PLUGIN_URL", argv[argv.length - 1]?.split("leapp://")[1]);
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
    app.setAppUserModelId("Leapp");
  }
};
// =============================== //
// Start the real application HERE //
// =============================== //
generateMainWindow();
