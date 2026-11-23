/**
 * Escapes text for the HTML strings the dialogs render with [innerHTML]. Angular's sanitiser keeps
 * <a href> and <img src>, so a session or account name (an SSO account name comes from AWS) must go in as text.
 *
 * @param text - the value to show literally
 */
export const escapeHtml = (text: unknown): string =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
