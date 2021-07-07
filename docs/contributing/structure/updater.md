# Leapp Updater

Leapp update system checks every **10 minutes** (counting from App start) that a new version is available. If so, a dialog message will pop up and will show:

- The version number
- The release date
- The changelog

<img width="426" alt="Screenshot 2021-05-11 at 10 45 58" src="https://user-images.githubusercontent.com/9497292/117786735-1e418f80-b246-11eb-8e53-b3a5f4c79126.png">

In this modal, the users have the possibility to:

- **Remind me later**: Leapp will shut down the modal, notify the user that a new update is available by changing the Tray icon (adding a red dot) <img width="55" alt="Screenshot_2021-05-04_at_10 28 21 (1)" src="https://user-images.githubusercontent.com/9497292/117785141-97d87e00-b244-11eb-83e7-c39b8f771314.png">. Now users will not be bothered anymore until the next release is available. This option is ** suitable for users that want to stick to a specific version **. Note that you can do this for every version and maintain the one you prefer.

- **Download update**: Leapp will open the Release URL in your *default* browser to let the User *manually* download the release for the specific OS and install it.

## How the Update System works in details

1) In Electron inside app ready we launch *autoUpdater* polling.

```
app.on('ready', () => { autoUpdater.checkForUpdates(); });
autoUpdater.on('update-available', (info) => {
    win.webContents.send('UPDATE_AVAILABLE', info);
});
```

2) In the Electron app start after auto-update we listen to the *update-available* event.

3) We communicate with Angular informing us that an update is available and we also send info about the update (changelog, date, and version).

4) Inside the *app component*, which is the entry point of the Angular application, we use a method to listen to Electron notification about an update being available.

5) During this process we also check the status of latest.json, which is a file that is written on app start. It contains the current version of Leapp or the *latest version we refused with the 'remind me later' option*.

> a. if the file doesn't exist Leapp creates it with the current version.

> b. if the file exists Leapp reads the saved version.

> c. now we have a saved version: we confront it with the actual version retrieved from package.json.

> d. if the saved version is ≤ of the actual version (package.json) we can overwrite the value in the file.

This operation ensures a specific case:

> You have the current one saved into the file: typically is when you never had an update over the current version, so you store the current version which will be < of a new update. This avoids overwriting the value of *latest.json* if you have already declined an update.

6) We retrieve *ipcRenderer* for the previous passages, thanks to the Native Service file, so we can read our UPDATE_AVAILABLE channel.

```
const ipc = this.app.getIpcRenderer();
ipc.on('UPDATE_AVAILABLE', (event, info) => { ... });
```

7) We receive an update from Electron with the update's info.

8) *setUpdateInfo* saves only the variables we need inside the updater service because we want to use them later, without passing them externally, to make all the methods inside the service callable everywhere transparently.

9) We check the current saved version (in the file) with the one retrieved from the update if < we call the update dialog and refresh the tray icon graphic.

10) In the update modal we show the changelog and the version as well as having two buttons, one for *Remind me later*, and one for *Download now*.

1) *Remind me* later is used to close the modal and return an event of type 'ignore the update'.

2) *Download update* closes the modal and returns an event of type 'download from URL'.

11) We read the event in the close callback of the modal from the updater service, if 'ignore', we save the updated version in the file to prevent other updates to show up, or if 'download', we go to the update page on GitHub.

12) When we ignore an update, we add the ability to call the update dialog again from the tray menu.

## Notes

- We have the following options for autoUpdater set on *FALSE*:

```
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;
autoUpdater.autoDownload = false;
```

- The rule of thumb is **fresh** ≤ **cache** ≤ **online**.
