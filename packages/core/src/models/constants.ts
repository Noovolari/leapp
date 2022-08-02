export const constants = {
  //General
  appName: "Leapp",
  lockFileDestination: ".Leapp/Leapp-lock.json",
  latestUrl: "https://leapp.cloud/releases.html",

  //Aws
  samlRoleSessionDuration: 3600, // 1h
  sessionDuration: 1200, // 20 min
  sessionTokenDuration: 36000, // 10h
  timeout: 10000,
  credentialsDestination: ".aws/credentials",
  defaultRegion: "us-east-1",
  maxSsoTps: 10, // Transaction per second for AWS SSO endpoint

  //Azure
  azureMsalCacheFile: ".azure/msal_token_cache.json",
  defaultLocation: "eastus",
  defaultAwsProfileName: "default",
  defaultAzureProfileName: "default-azure",

  mac: "mac",
  linux: "linux",
  windows: "windows",
  inApp: "In-app",
  inBrowser: "In-browser",
  forcedCloseBrowserWindow: "ForceCloseBrowserWindow",

  confirmed: "**CONFIRMED**",
  confirmClosed: "**MODAL_CLOSED**",
  confirmClosedAndIgnoreUpdate: "**IGNORE_UPDATE_AND_MODAL_CLOSED**",
  confirmCloseAndDownloadUpdate: "**GO_TO_DOWNLOAD_PAGE_AND_MODAL_CLOSED**",

  macOsTerminal: "Terminal",
  macOsIterm2: "iTerm2",
  systemDefaultTheme: "System Default",

  lightTheme: "Light Theme",
  darkTheme: "Dark Theme",
  colorTheme: "System Default",

  cliStartAwsFederatedSessionChannel: "aws-federated-session-start-channel",
  cliLogoutAwsFederatedSessionChannel: "aws-federated-session-logout-channel",
  cliRefreshSessionsChannel: "refresh-sessions-channel",
  ipcServerId: "leapp_da",

  roleSessionName: "assumed-from-leapp",
  // Credential Process
  credentialFile: "credential-file-method",
  credentialProcess: "credential-process-method",

  // Contains Env for SSM on macOS
  ssmSourceFileDestination: ".Leapp/ssm-env",
};
