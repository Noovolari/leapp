"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require('assert');
var isURL = require('is-url');
var isDev = require('electron-is-dev');
var ms = require('ms');
var gh = require('github-url-to-object');
var path = require('path');
var fs = require('fs');
var os = require('os');
var format = require('util').format;
var userAgent = format('%s/%s (%s: %s)', 'electron-updater-app', '4.3.5', os.platform(), os.arch());
var supportedPlatforms = ['darwin', 'win32'];
var logger = require('electron-log');
var electron = require('electron');
var autoUpdater = require('electron-updater').autoUpdater;
var AppUpdater = /** @class */ (function () {
    function AppUpdater() {
    }
    AppUpdater.getInstance = function () {
        if (this.instance === undefined) {
            this.instance = new AppUpdater();
        }
        return this.instance;
    };
    /**
     * Init the daemon process of checking the repo at a base interval;
     * if a new version is spotted, download it and notify the user to install it
     */
    AppUpdater.prototype.initUpdater = function (opts) {
        if (opts === void 0) { opts = {}; }
        this.opts = this.validateOptions(opts);
        // Don't attempt to update during development
        if (isDev) {
            var message = 'Leapp config looks good; aborting updates since app is in development mode';
            logger.log(message);
            return;
        }
        var _a = this.opts, host = _a.host, repo = _a.repo, allowDowngrade = _a.allowDowngrade, allowPrerelease = _a.allowPrerelease;
        var app = electron.app, dialog = electron.dialog;
        var feedURL = host + "/" + repo + "/" + process.platform + "-" + process.arch + "/" + app.getVersion();
        var requestHeaders = { 'User-Agent': userAgent };
        function log() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            logger.log.apply(logger, args);
        }
        // exit early on unsupported platforms, e.g. `linux`
        if (typeof process !== 'undefined' && process.platform && !supportedPlatforms.includes(process.platform)) {
            log("Electron's autoUpdater does not support the '" + process.platform + "' platform");
            return;
        }
        log('feedURL', feedURL);
        log('requestHeaders', requestHeaders);
        autoUpdater.allowDowngrade = allowDowngrade;
        autoUpdater.allowPrerelease = allowPrerelease;
        // autoUpdater.setFeedURL(feedURL, requestHeaders);
        autoUpdater.on('error', function (err) {
            log('updater error');
            log(err);
        });
        autoUpdater.on('checking-for-update', function () {
            log('checking-for-update');
        });
        autoUpdater.on('update-available', function () {
            log('update-available; downloading...');
        });
        autoUpdater.on('update-not-available', function () {
            log('update-not-available');
        });
        if (this.opts.notifyUser) {
            autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateURL) {
                log('update-downloaded', [event, releaseNotes, releaseName, releaseDate, updateURL]);
                var dialogOpts = {
                    type: 'info',
                    buttons: ['Restart', 'Later'],
                    title: 'Application Update',
                    message: process.platform === 'win32' ? releaseNotes : releaseName,
                    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
                };
                dialog.showMessageBox(dialogOpts).then(function (_a) {
                    var response = _a.response;
                    if (response === 0) {
                        autoUpdater.quitAndInstall();
                    }
                });
            });
        }
    };
    /**
     * Start the update daemon to check for new versions
     */
    AppUpdater.prototype.checkForUpdates = function () {
        if (!isDev) {
            // check for updates right away and keep checking later
            autoUpdater.checkForUpdates();
            setInterval(function () { autoUpdater.checkForUpdates(); }, ms(this.opts.updateInterval));
        }
    };
    AppUpdater.prototype.validateOptions = function (opts) {
        var defaults = {
            host: 'https://update.electronjs.org',
            updateInterval: '10 minutes',
            logger: console,
            notifyUser: true,
            allowDowngrade: false,
            allowPrerelease: false
        };
        var _a = Object.assign({}, defaults, opts), host = _a.host, updateInterval = _a.updateInterval, notifyUser = _a.notifyUser, allowDowngrade = _a.allowDowngrade, allowPrerelease = _a.allowPrerelease;
        var repo = opts.repo;
        if (!repo) {
            var pkgBuf = fs.readFileSync(path.join(electron.app.getAppPath(), 'package.json'));
            var pkgData = JSON.parse(pkgBuf.toString());
            var repoString = (pkgData.repository && pkgData.repository.url) || pkgData.repository;
            var repoObject = gh(repoString);
            assert(repoObject, 'repo not found. Add repository string to your app\'s package.json file');
            repo = repoObject.user + "/" + repoObject.repo;
        }
        assert(repo && repo.length && repo.includes('/'), 'repo is required and should be in the format `owner/repo`');
        assert(isURL(host) && host.startsWith('https'), 'host must be a valid HTTPS URL');
        assert(typeof updateInterval === 'string' && updateInterval.match(/^\d+/), 'updateInterval must be a human-friendly string interval like `20 minutes`');
        assert(ms(updateInterval) >= 5 * 60 * 1000, 'updateInterval must be `5 minutes` or more');
        assert(logger && typeof logger.log, 'function');
        return { host: host, repo: repo, updateInterval: updateInterval, logger: logger, notifyUser: notifyUser, allowDowngrade: allowDowngrade, allowPrerelease: allowPrerelease };
    };
    return AppUpdater;
}());
exports.AppUpdater = AppUpdater;
//# sourceMappingURL=leapp-updater.js.map