import {Service} from "../core/service";
import {DataApiConnector} from "../database/data-api-connector";

export class SignatureUpdaterService extends Service {
  private readonly dataApiConnector: DataApiConnector;

  constructor(region: string) {
    super(region);
    this.dataApiConnector = new DataApiConnector();
  }

  public async updateRds(pluginName: string, hash: string, signature: string): Promise<void> {
    await this.dataApiConnector.executeStatement(
      `UPDATE plugin
       SET hash = :hash,
           signature = :signature
       WHERE plugin_name = :plugin_name`,
      {
        plugin_name: pluginName,
        hash: hash,
        signature: signature
      }
    )
  }
}
