import { LoggedException, LogLevel } from "./log-service";

/** The only URL schemes Leapp hands to the OS (browser, mail client). */
export const allowedExternalUrlSchemes = ["https:", "mailto:"];

/**
 * Refuses a URL that the OS must not open: file:, smb:, javascript:, custom protocol handlers and anything that is
 * not a URL can run code or read files on Windows and macOS. Every IOpenExternalUrlService checks with it first.
 *
 * @param url - the URL about to be opened
 * @param context - the caller, for the log entry
 */
export const assertExternalUrl = (url: string, context: unknown): void => {
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    protocol = "";
  }
  if (!allowedExternalUrlSchemes.includes(protocol)) {
    throw new LoggedException("Leapp can only open https and mailto links", context, LogLevel.warn, true);
  }
};
