import type { LeappFlavor } from "@noovolari/leapp-core/models/flavor";

// Where the desktop app looks for updates. The one place that names the feed, so moving it to a beSharp
// domain later changes one value. Shared by the main process (electron/auto-updater.ts).
export const productionUpdateFeedUrl = "https://asset.noovolari.com/latest";

export interface UpdateFeed {
  provider: "generic";
  url: string;
  channel: "latest";
}

/**
 * The feed the update check uses, or undefined when the build doesn't check: prod always
 * checks the production feed and ignores LEAPP_UPDATE_FEED_URL; dev and qa check only when it is set, against it.
 */
export const updateFeed = (flavor: LeappFlavor, overrideUrl: string | undefined): UpdateFeed | undefined => {
  if (flavor === "prod") {
    return { provider: "generic", url: productionUpdateFeedUrl, channel: "latest" };
  }
  return overrideUrl ? { provider: "generic", url: overrideUrl, channel: "latest" } : undefined;
};
