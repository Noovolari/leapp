import {Workspace} from './workspace';

/**
 * We use this configuration as a POTO for the Leapp Configuration file.
 * Parameters here will be converted to a cryptographed file in your home directory in .leapp directory
 */
export interface Configuration {
  uid: string;
  // TODO: We have just one language
  language: string;
  defaultWorkspace: string;
  avatar: string;
  // TODO: We need more than one workspace
  workspaces: Workspace[];
}
