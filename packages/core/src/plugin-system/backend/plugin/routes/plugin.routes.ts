import {Get, Path, Post, Put, Query, Route, Tags} from "@tsoa/runtime";
import {PluginDto} from "../dto/plugin.dto";
import {PluginService} from "../service/plugin.service";
import {environment} from "../../environments/environment";
import {PluginConverter} from "../converter/plugin.converter";

@Route("v1/plugins")
@Tags("plugins")
export class PluginRoutes {
  pluginService = new PluginService(environment.REGION);
  pluginConverter = new PluginConverter();

  @Get("")
  async pluginList(
    @Query('q') q?: string
  ): Promise<PluginDto[]> {
    console.log("List plugin");
    return this.pluginConverter.toListDto(await this.pluginService.listPlugin(q));
  }

  @Get("{pluginId}")
  async getPlugin(
    @Path("pluginId") pluginName: string
  ) {
    console.log("Get plugin");
    return this.pluginConverter.toDto(await this.pluginService.getPlugin(pluginName));
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
