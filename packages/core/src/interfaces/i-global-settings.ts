import PluginStatus from "../models/plugin-status";
import Segment from "../models/segment";

export interface GlobalSettings {
  defaultRegion: string;
  defaultLocation: string;
  macOsTerminal: string;
  pluginsStatus: PluginStatus[];
  segments: Segment[];
  colorTheme: string;
  extensionEnabled: boolean;
  credentialMethod: string;
  samlRoleSessionDuration: number;
  ssmRegionBehaviour: string;
}
