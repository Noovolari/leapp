export enum OperatingSystem {
  windows = "windows",
  mac = "mac",
  linux = "linux",
}

interface OperatingSystemMap {
  [key: string]: OperatingSystem;
}

export const osMap: OperatingSystemMap = {
  linux: OperatingSystem.linux,
  darwin: OperatingSystem.mac,
  win32: OperatingSystem.windows,
};
