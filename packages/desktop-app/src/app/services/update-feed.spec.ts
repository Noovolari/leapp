import { UpdateFeed, updateFeed } from "./update-feed";

// Only the prod flavor checks the update feed; dev and qa check only when
// LEAPP_UPDATE_FEED_URL is set, which then replaces the feed URL. Prod ignores the variable.
describe("update feed per flavor", () => {
  const productionFeed: UpdateFeed = { provider: "generic", url: "https://asset.noovolari.com/latest", channel: "latest" };

  it("prod checks asset.noovolari.com/latest, generic provider, channel latest", () => {
    expect(updateFeed("prod", undefined)).toEqual(productionFeed);
  });

  it("prod ignores LEAPP_UPDATE_FEED_URL", () => {
    expect(updateFeed("prod", "http://localhost:8080")).toEqual(productionFeed);
  });

  it("dev and qa run no update check without LEAPP_UPDATE_FEED_URL", () => {
    expect(updateFeed("dev", undefined)).toBeUndefined();
    expect(updateFeed("qa", undefined)).toBeUndefined();
    expect(updateFeed("dev", "")).toBeUndefined();
  });

  it("dev and qa check the URL of LEAPP_UPDATE_FEED_URL", () => {
    expect(updateFeed("dev", "http://localhost:8080")).toEqual({ provider: "generic", url: "http://localhost:8080", channel: "latest" });
    expect(updateFeed("qa", "http://localhost:9090/feed")).toEqual({ provider: "generic", url: "http://localhost:9090/feed", channel: "latest" });
  });
});
