export const constants = {
  //General
  appName: "Leapp",
  rsaBinFileDestination: ".Leapp/rsa.bin",
  lockFileDestination: ".Leapp/Leapp-lock.json",
  lockFileBackupPath: ".Leapp/Leapp-lock.backup.bin",
  latestUrl: "https://leapp.cloud/releases.html",
  workspaceLastVersion: 7,
  slackUrl: "https://join.slack.com/t/noovolari/shared_invite/zt-opn8q98k-HDZfpJ2_2U3RdTnN~u_B~Q",
  localWorkspaceName: "Local workspace",
  localWorkspaceDescription: "Community Edition",
  currentWorkspaceKeychainKey: "current-workspace",
  localWorkspaceKeychainValue: "local",

  //Aws
  samlRoleSessionDuration: 3600, // 1h
  sessionDuration: 1200, // 20 min
  sessionTokenDuration: 36000, // 10h
  timeout: 10000,
  credentialsDestination: ".aws/credentials",
  defaultRegion: "us-east-1",
  maxSsoTps: 5, // Transaction per second for AWS SSO endpoint

  //Azure
  azureMsalCacheFile: ".azure/msal_token_cache.json",
  defaultLocation: "eastus",
  defaultAwsProfileName: "default",
  defaultAzureProfileName: "default-azure",

  inApp: "In-app",
  inBrowser: "In-browser",
  forcedCloseBrowserWindow: "ForceCloseBrowserWindow",

  confirmed: "**CONFIRMED**",
  confirmClosed: "**MODAL_CLOSED**",
  confirmClosedAndIgnoreUpdate: "**IGNORE_UPDATE_AND_MODAL_CLOSED**",
  confirmCloseAndDownloadUpdate: "**GO_TO_DOWNLOAD_PAGE_AND_MODAL_CLOSED**",

  macOsTerminal: "Terminal",
  macOsIterm2: "iTerm2",
  macOsWarp: "Warp",
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

  // SSM region behavior
  ssmRegionNo: "No",
  ssmRegionDefault: "Use default region",

  // Contains Env for SSM on macOS
  ssmSourceFileDestination: ".Leapp/ssm-env",
  pluginEnvFileDestination: ".Leapp/plugin-env",

  npmRequiredPluginKeyword: "leapp-plugin",
  skipPluginValidation: true,
  disablePluginSystem: false,
  pluginPortalUrl: "https://vv0r45fadf.execute-api.eu-west-1.amazonaws.com/api/api/v1/plugins",
  // Public Key for signature
  // TODO: move it to the leapp site in future
  publicKey:
    "-----BEGIN PUBLIC KEY-----\n" +
    "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqti1Z2PXLzKgkAgm9sMH\n" +
    "kW1HMZM2cWK49nc9MqF3/QF3bLkwtlveaaDl0ZwuPT25iAVdWTUPVGLh+4oBRENR\n" +
    "sk3YUDptt90cRyzcTCPzsa4bWDOmIwPEUZFpIsdTEfs69UH0rHcFZOIbGjr+xGsn\n" +
    "2YXV5/exQJ5sdcwKeNS1MfYDCqqz9+teC2vHl6s7Vy0xQQO98tWHkE99iS6m8dvK\n" +
    "x2hqGuQb2J/lp7Rt1eCfUwFqvDFNnXk4LAHo2et9NInc+UIjn4ovLy/xb73HO6bQ\n" +
    "ELVQ5oGUvkxo8uWhHEWt+On1xvH8Cc284yRW8kcrM1XwZgWdglQXlctbMaec8DQS\n" +
    "94CMzctnsTtoCJonV+T1pEzZki3me/MaP7ZFxPITiWoDz1k+DwTLFoDW1aI7Aflj\n" +
    "HQWBxFXrf5jL4oHRLVXhdikW9IeAvnFwe0T15QYOhl/U+85ljcKuWMnwqW9uVWmO\n" +
    "atRbgEVaINwFsiCyNJeV7AbSNAWXIFQa4vF7OUq727uonN9aJC6R/CWy62FltFh4\n" +
    "1D4ql66z0crg9LBNmhEJnZJlSfoVQNjrWiY7RPrGRAHl/bCRxdP8h6IoFK7a9YyO\n" +
    "yP6Ekgn8yeDmON1JoX0E0Tdm6dfXVY5v2K8KaT2/XtsqRlwCCU+pXRsQwJfQcknZ\n" +
    "aNqnY3aBtCwmaesTlrc5bR8CAwEAAQ==\n" +
    "-----END PUBLIC KEY-----",

  touchIdKeychainItemName: "touch-id-lock",
  touchIdEnabled: true,
  requirePasswordEveryWeek: { key: "Every week", value: 7 },
  requirePasswordEveryTwoWeeks: { key: "Every 2 weeks", value: 14 },
  requirePasswordEveryMonth: { key: "Every month", value: 30 },
  requirePasswordNever: { key: "Never", value: 999999 },
};
