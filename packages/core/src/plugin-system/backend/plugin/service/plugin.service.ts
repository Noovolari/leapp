import {Service} from "../../core/service";
import {DataApiConnector} from "../../database/data-api-connector";
import {PluginRdsModel} from "../model/plugin.rds.model";
import {PluginConverter} from "../converter/plugin.converter";
import {CustomError} from "../../core/custom.error";
import {HTTPStatusCodeEnum} from "../../enum/http-status-code.enum";
import {PluginModel} from "../model/plugin.model";

export class PluginService extends Service {
  private dataApiConnector: DataApiConnector;
  private pluginConverter: PluginConverter;

  constructor(region: string) {
    super(region);
    this.dataApiConnector = new DataApiConnector();
    this.pluginConverter = new PluginConverter();
  }

  public async listPlugin(queryParam?: string): Promise<PluginModel[]> {
    const pluginListRds: PluginRdsModel[] = (await this.dataApiConnector.executeStatement(
      `SELECT p.*, a.id a_id, a.name AS a_name, a.surname AS a_surname, a.email AS a_email, s.id AS s_id, s.name AS s_name FROM plugin AS p
            JOIN author a ON p.author_id = a.id
            JOIN status s ON p.status_id = s.id
            WHERE p::text ILIKE :queryParam
            OR a::text ILIKE :queryParam
            OR s::text ILIKE :queryParam`,
      {
        queryParam: queryParam ? `%${queryParam}%` : '%%'
      })).records;

    return pluginListRds.map((pluginRdsModel) => this.pluginConverter.fromRds(pluginRdsModel));
  }

  public async getPlugin(pluginName: string): Promise<PluginModel> {
    const pluginRds: PluginRdsModel = (await this.dataApiConnector.executeStatement(
      `SELECT p.*, a.id a_id, a.name AS a_name, a.surname AS a_surname, a.email AS a_email, s.id AS s_id, s.name AS s_name FROM plugin AS p
            JOIN author a ON p.author_id = a.id
            JOIN status s ON p.status_id = s.id
            WHERE p.plugin_name = :name`,
      {
        name: pluginName
      })).records[0];
    if (!pluginRds) {
      throw new CustomError(HTTPStatusCodeEnum.notFound, "Plugin Not Found");
    }
    return this.pluginConverter.fromRds(pluginRds);
  }
}
