import { Injectable } from "@angular/core";
import { Environment } from "./environment";

@Injectable({ providedIn: "root" })
export class ConfigurationService {
  static forcedAPiEndpoint: string;

  constructor() {
    ConfigurationService.forcedAPiEndpoint = "";
  }

  public static setForcedAPiEndpoint = (endpoint: string): string => (ConfigurationService.forcedAPiEndpoint = endpoint);

  public getLocation = (): Location => window.location;
  public getNavigator = (): Navigator => window.navigator;

  public get environment(): Environment {
    const host = this.getLocation().hostname;
    if (host === "localhost" || host === "0.0.0.0" || host === "127.0.0.1") {
      return Environment.local;
    } else if (host === "preview.leapp.com") {
      return Environment.preview;
    } else {
      return Environment.production;
    }
  }

  public get apiEndpoint(): string {
    if (ConfigurationService.forcedAPiEndpoint !== "") {
      return ConfigurationService.forcedAPiEndpoint;
    }

    const protocol = this.getLocation().protocol;
    let hostName = "api.leapp.com";
    if (this.environment === Environment.local) {
      hostName = this.getLocation().hostname;
    } else if (this.environment === Environment.preview) {
      hostName = "api.preview.leapp.com";
    }
    const port = this.environment === Environment.local ? ":3000" : "";
    return `${protocol}//${hostName}${port}/TESTTTTT/${this.getLocation().hostname}/ttt/`;
  }

  public get userLanguage(): string {
    return this.getNavigator().language;
  }
}
