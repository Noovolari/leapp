//import { PluginEnvironment } from "@noovolari/leapp-core/plugin-system/plugin-environment";
import { Session } from "@noovolari/leapp-core/models/session";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
//import { EnvironmentType } from "@noovolari/leapp-core/plugin-system/plugin-environment";
//import { IPlugin } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
//import { IPluginMetadata } from "@noovolari/leapp-core/plugin-system/interfaces/i-plugin";
import { test2 } from "./test2";
import * as path from "path";
import * as fs from "fs";
const tar = require("tar");

export class HelloWorldPlugin {
  public metadata: any;

  private providerService: any;

  async bootstrap(pluginEnvironment: any): Promise<void> {
    fs.writeFileSync("/tmp/hello", "world");
    await tar.x({
      file: "dfg",
      strip: 1,
      ["C"]: "fsgsfg",
    });

    if (pluginEnvironment.environmentType !== "desktop-app") {
      this.providerService.logService.log(new LoggedEntry("HelloWorldPlugin is not compatible with CLI", this, LogLevel.info, true));
    }
    this.providerService = pluginEnvironment.providerService;
  }

  async applySessionAction(session: Session): Promise<void> {
    this.providerService.logService.log(
      new LoggedEntry("Hello from plugin TestPlugin with session: " + session.sessionName + test2 + path.join(), this, LogLevel.info, true)
    );
  }
}
