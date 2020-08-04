import {Workspace} from './workspace';

/**
 * We use this configuration as a POTO for the Leapp Configuration file.
 * Parameters here will be converted to a cryptographed file in your home directory in .leapp directory
 */
export interface Configuration {
  licence: string;
  uid: string;
  language: string;
  defaultWorkspace: string;
  avatar: string;
  federationUrl: string;
  workspaces: Workspace[];
}
