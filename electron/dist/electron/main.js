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
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var environment_1 = require("../src/environments/environment");
var CryptoJS = require("crypto-js");
var initial_configuration_1 = require("../src/app/core/initial-configuration");
var node_machine_id_1 = require("node-machine-id");
var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, globalShortcut = _a.globalShortcut, Menu = _a.Menu, dialog = _a.dialog;
var url = require('url');
var fs = require('fs');
var os = require('os');
var log = require('electron-log');
var exec = require('child_process').exec;
var ipc = require('electron').ipcMain;
// Fix for warning at startup
app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();
// Main Window configuration: set here tyhe options to make it works with your app
// Electron is the application wrapper so NOT log is prompted when we build an
// application, we need to log to a file instead
var windowDefaultConfig = {
    dir: path.join(__dirname, "/../../../dist/leapp-client"),
    browserWindow: {
        width: 430,
        height: 600,
        title: "",
        icon: path.join(__dirname, "assets/images/Leapp.png"),
        resizable: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            devTools: !environment_1.environment.production,
            nodeIntegration: true
        }
    }
};
// Define the workspace directory from config file in *src/environments*
// Define the aws credentials path from config file in *src/environments*
var workspacePath = os.homedir() + '/' + environment_1.environment.lockFileDestination;
var awsCredentialsPath = os.homedir() + '/' + environment_1.environment.credentialsDestination;
// Setup the first workspace in order to define the .Leapp directory and the .aws one
var setupWorkspace = function () {
    try {
        // Generate .Leapp and .aws directories for future works
        fs.mkdirSync(os.homedir() + '/.Leapp');
        fs.mkdirSync(os.homedir() + '/.aws');
    }
    catch (err) {
        log.warn('directory leapp or aws already exist');
    }
    finally {
        try {
            // If it is the first time and there's a file, let's backup the file
            if (!fs.existsSync(workspacePath) && fs.existsSync(awsCredentialsPath)) {
                fs.renameSync(awsCredentialsPath, awsCredentialsPath + '.leapp.bkp');
            }
            // Write workspace file
            fs.writeFileSync(workspacePath, CryptoJS.AES.encrypt(JSON.stringify(initial_configuration_1.initialConfiguration, null, 2), node_machine_id_1.machineIdSync()).toString());
            // Write credential file
            fs.writeFileSync(awsCredentialsPath, '');
        }
        catch (e) {
            log.error(e);
            app.exit(0);
        }
        // Launch initWorkspace again, now it will be loaded correctly because the file and directories are there
        initWorkspace();
    }
};
// Generate the main Electron window
var generateMainWindow = function () {
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
        if (win === null || win === undefined) {
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
        require('update-electron-app')();
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
// Prepare and generate the main window if everything is setupped correctly
var initWorkspace = function () {
    // Remove unused voices from contextual menu
    var template = [
        {
            label: 'Leapp',
            submenu: [
                { label: 'About', role: 'about' },
                { label: 'Quit', role: 'quit' }
            ]
        }
    ];
    if (!environment_1.environment.production) {
        template[0].submenu.push({ label: 'Open DevTool', role: 'toggledevtools' });
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    if (process.platform === 'linux' && ['Pantheon', 'Unity:Unity7'].indexOf(process.env.XDG_CURRENT_DESKTOP) !== -1) {
        process.env.XDG_CURRENT_DESKTOP = 'Unity';
    }
    var workspace = fs.existsSync(workspacePath) ? JSON.parse(CryptoJS.AES.decrypt(fs.readFileSync(workspacePath, { encoding: 'utf-8' }), node_machine_id_1.machineIdSync()).toString(CryptoJS.enc.Utf8)) : undefined;
    if (workspace === undefined) {
        // Setup your first workspace and then run createWindow
        log.info('Setupping workspace for the first time');
        setupWorkspace();
    }
    else {
        // Check and activate proxy pass if necessary
        if (workspace.workspaces[0] !== undefined && workspace.workspaces[0].proxyUrl) {
            console.log('workspace in main, check proxy url:', workspace);
            process.env.HTTP_PROXY = workspace.workspaces[0].proxyUrl;
            var globalTunnel = require('global-tunnel');
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
//# sourceMappingURL=main.js.map