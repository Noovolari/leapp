import { LeappBaseError } from "../errors/leapp-base-error";
import { LogLevel } from "../services/log-service";

/**
 * Build flavors. `prod` is what users install; `dev` is anything built or run from the repository.
 * A dev Leapp uses its own workspace dir, keychain service, socket, ports and binary names, so it never
 * Touches an installed prod Leapp. `qa` belongs to the functional test harness. Each client entry point sets LEAPP_FLAVOR from its package.json
 * (`leappFlavor`) before core is loaded; unset means prod.
 */
export type LeappFlavor = "prod" | "dev" | "qa";

const flavors: LeappFlavor[] = ["prod", "dev", "qa"];

export const currentFlavor = (): LeappFlavor => {
  // globalThis.process: the desktop renderer has Node's process through nodeIntegration, Karma has a stub
  const value = (globalThis as any).process?.env?.LEAPP_FLAVOR;
  if (value === undefined || value === "") {
    return "prod";
  }
  if (!flavors.includes(value)) {
    throw new LeappBaseError("LeappFlavorError", "flavor", LogLevel.error, `Unknown LEAPP_FLAVOR '${value}': use prod, dev or qa`);
  }
  return value as LeappFlavor;
};

/** Picks the value of the current flavor. */
export const byFlavor = <T>(values: { [flavor in LeappFlavor]: T }): T => values[currentFlavor()];
