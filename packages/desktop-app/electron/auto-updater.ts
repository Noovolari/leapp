import { currentFlavor } from "@noovolari/leapp-core/models/flavor";
import { updateFeed } from "../src/app/services/update-feed";

const { autoUpdater } = require("electron-updater");

const CHECK_INTERVAL_MINUTES = 10;

// The update check. It only finds out whether a newer version exists and tells the
// renderer (UPDATE_AVAILABLE); nothing is downloaded or installed. Errors are only logged.
export const startAutoUpdater = (getWindow: () => any): void => {
  const feed = updateFeed(currentFlavor(), process.env.LEAPP_UPDATE_FEED_URL);
  if (!feed) {
    console.log("[AUTO-UPDATER] Off for this build flavor (set LEAPP_UPDATE_FEED_URL to test it)");
    return;
  }

  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  // An unpackaged app (npm run build-and-run-dev) checks only with the explicit feed below
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.setFeedURL(feed);

  autoUpdater.on("update-available", (info) => {
    console.log("[AUTO-UPDATER] Update available:", info?.version);
    getWindow()?.webContents.send("UPDATE_AVAILABLE", {
      version: info?.version,
      releaseName: info?.releaseName,
      releaseDate: info?.releaseDate,
    });
  });
  autoUpdater.on("error", (error) => console.log("[AUTO-UPDATER] Error:", error?.message ?? error));

  const check = (): void => {
    autoUpdater.checkForUpdates().catch((error) => console.log("[AUTO-UPDATER] Check failed:", error?.message ?? error));
  };
  check();
  setInterval(check, 1000 * 60 * CHECK_INTERVAL_MINUTES);
};
