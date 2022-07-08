import {Get, Post, Put, Route, Tags} from "@tsoa/runtime";

@Route("v1/plugins")
@Tags("plugins")
export class PluginRoutes {
  @Get("")
  async pluginList() {
    console.log("List plugin");
  }

  @Get("{pluginId}")
  async downloadPlugin() {
    console.log("Download plugin");
  }

  @Post()
  async createPlugin() {
    console.log("Created plugin");
  }

  @Put("{pluginId}")
  async updatePlugin() {
    console.log("Update plugin");
  }
}
