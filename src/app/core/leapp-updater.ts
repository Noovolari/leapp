import {UpdaterOptions} from '../models/updater-options';

const assert = require('assert');
const isURL = require('is-url');
const isDev = require('electron-is-dev');
const ms = require('ms');
const gh = require('github-url-to-object');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { format } = require('util');
const userAgent = format('%s/%s (%s: %s)', 'electron-updater-app', '4.3.5', os.platform(), os.arch());
const supportedPlatforms = ['darwin', 'win32'];
const logger = require('electron-log');
const electron = require('electron');
const {autoUpdater} = require('electron-updater');

export class AppUpdater {
  private static instance: AppUpdater;
  private opts;

  private constructor(opts: UpdaterOptions = {}) {
    // Check for bad input early, so it will be logged during development
    this.opts = this.validateOptions(opts);
  }

  static build(opts: UpdaterOptions) {
    if (this.instance === undefined) {
      this.instance = new AppUpdater(opts);
    }
  }

  static getInstance() {
    if (this.instance === undefined) {
      throw new Error('Call build first!');
    }
    return this.instance;
  }

  /**
   * Init the daemon process of checking the repo at a base interval;
   * if a new version is spotted, download it and notify the user to install it
   */
  initUpdater() {
    // Don't attempt to update during development
    if (isDev) {
      const message = 'Leapp config looks good; aborting updates since app is in development mode';
      logger.log(message);
      return;
    }

    const {host, repo, allowDowngrade, allowPrerelease} = this.opts;
    const {app, dialog} = electron;
    const feedURL = `${host}/${repo}/${process.platform}-${process.arch}/${app.getVersion()}`;

    const requestHeaders = {'User-Agent': userAgent};

    function log(...args) {
      logger.log(...args);
    }

    // exit early on unsupported platforms, e.g. `linux`
    if (typeof process !== 'undefined' && process.platform && !supportedPlatforms.includes(process.platform)) {
      log(`Electron's autoUpdater does not support the '${process.platform}' platform`);
      return;
    }

    log('feedURL', feedURL);
    log('requestHeaders', requestHeaders);

    autoUpdater.allowDowngrade = allowDowngrade;
    autoUpdater.allowPrerelease = allowPrerelease;

    // autoUpdater.setFeedURL(feedURL, requestHeaders);

    autoUpdater.on('error', err => {
      log('updater error');
      log(err);
    });

    autoUpdater.on('checking-for-update', () => {
      log('checking-for-update');
    });

    autoUpdater.on('update-available', () => {
      log('update-available; downloading...');
    });

    autoUpdater.on('update-not-available', () => {
      log('update-not-available');
    });

    if (this.opts.notifyUser) {
      autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
        log('update-downloaded', [event, releaseNotes, releaseName, releaseDate, updateURL]);

        const dialogOpts = {
          type: 'info',
          buttons: ['Restart', 'Later'],
          title: 'Application Update',
          message: process.platform === 'win32' ? releaseNotes : releaseName,
          detail: 'A new version has been downloaded. Restart the application to apply the updates.'
        };

        dialog.showMessageBox(dialogOpts).then(({response}) => {
          if (response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
      });
    }
  }

  /**
   * Start the update daemon to check for new versions
   */
  checkForUpdates() {
    if (!isDev) {
      // check for updates right away and keep checking later
      autoUpdater.checkForUpdates();
      setInterval(() => { autoUpdater.checkForUpdates(); }, ms(this.opts.updateInterval));
    }
  }

  private validateOptions(opts: UpdaterOptions) {
    const defaults = {
      host: 'https://update.electronjs.org',
      updateInterval: '10 minutes',
      logger: console,
      notifyUser: true,
      allowDowngrade: false,
      allowPrerelease: false
    };
    const { host, updateInterval, notifyUser, allowDowngrade, allowPrerelease } = Object.assign({}, defaults, opts);

    let repo = opts.repo;
    if (!repo) {
      const pkgBuf = fs.readFileSync(path.join(electron.app.getAppPath(), 'package.json'));
      const pkgData = JSON.parse(pkgBuf.toString());
      const repoString = (pkgData.repository && pkgData.repository.url) || pkgData.repository;
      const repoObject = gh(repoString);

      assert(
        repoObject,
        'repo not found. Add repository string to your app\'s package.json file'
      );
      repo = `${repoObject.user}/${repoObject.repo}`;
    }

    assert(
      repo && repo.length && repo.includes('/'),
      'repo is required and should be in the format `owner/repo`'
    );

    assert(
      isURL(host) && host.startsWith('https'),
      'host must be a valid HTTPS URL'
    );

    assert(
      typeof updateInterval === 'string' && updateInterval.match(/^\d+/),
      'updateInterval must be a human-friendly string interval like `20 minutes`'
    );

    assert(
      ms(updateInterval) >= 5 * 60 * 1000,
      'updateInterval must be `5 minutes` or more'
    );

    assert(
      logger && typeof logger.log,
      'function'
    );

    return { host, repo, updateInterval, logger, notifyUser, allowDowngrade, allowPrerelease };
  }

}
