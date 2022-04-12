import { Flags } from "@oclif/core";

export const force = Flags.boolean({
  description: "force a command without asking for confirmation (-f, --force)", // help description for flag
  hidden: false,
  default: false,
  char: "f",
});

// IDP URL
export const idpUrl = Flags.string({
  description: "the idp url address we want to create", // help description for flag
  hidden: false,
});

export const idpUrlId = Flags.string({
  description: "the idp url id that we want to pass to the function like the delete one", // help description for flag
  hidden: false,
});

// INTEGRATIONS
export const integrationAlias = Flags.string({
  description: "alias that identifies an integration",
  hidden: false,
});

export const integrationPortalUrl = Flags.string({
  description: "url that identifies the integration portal where you authenticate",
  hidden: false,
});

export const integrationRegion = Flags.string({
  description: "an AWS valid region code for the integration",
  hidden: false,
});

export const integrationMethod = Flags.string({
  description: "either in-app or in-browser",
  hidden: false,
});
