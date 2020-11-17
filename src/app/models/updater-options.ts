export interface UpdaterOptions {
  host?: string;
  repo?: string;
  updateInterval?: number;
  allowDowngrade?: boolean;
  allowPrerelease?: boolean;
  notifyUser?: boolean;
}
