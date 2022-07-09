import {Service} from "../core/service";
import {DataApiConnector} from "../database/data-api-connector";
import {Logger} from "../core/logger";
import {PluginConverter} from "../converter/plugin.converter";
import {NpmPackagesDto} from "../dto/npm-packages.dto";
import {SendMessageCommand} from "@aws-sdk/client-sqs";
import {environment} from "../environments/environment";

export class PluginUpdaterService extends Service {
  private readonly dataApiConnector: DataApiConnector;

  constructor(region: string) {
    super(region);
    this.dataApiConnector = new DataApiConnector();
  }

  public async updateRds(npmPackagesDto: NpmPackagesDto[]): Promise<void> {
    for(const npmPackage of npmPackagesDto) {
      try {
        await this.sqs.send(new SendMessageCommand({
          QueueUrl: environment.QUEUE_URL,
          MessageBody: JSON.stringify(npmPackage)
        }))
      } catch (e) {
        Logger.error(e);
      }
    }
    const pluginConverter = new PluginConverter();
    const pluginModelList = npmPackagesDto.map(
      (npmPackage) => pluginConverter.toModel(npmPackage));

    for(const plugin of pluginModelList) {
      try {
        const authorId = (await this.dataApiConnector.executeStatement(
          `INSERT INTO author(name, email)
           VALUES (:name, :email)
           ON CONFLICT (name) DO UPDATE
             SET email = :email
           RETURNING id`,
          {
            name: plugin.author.name,
            email: plugin.author.email
          }
        )).records[0].id

        const statusId = (await this.dataApiConnector.executeStatement(
          `SELECT * FROM status WHERE name = :name`, {
            name: 'pending'
          }
        )).records[0].id;

        await this.dataApiConnector.executeStatement(
          `INSERT INTO plugin(plugin_name, author_id, description, tags, uri, signature, hash, status_id, created_at, updated_at)
           VALUES (:plugin_name, cast(:author_id as uuid), :description, :tags, :uri, :signature, :hash, cast(:status_id as uuid), current_timestamp, current_timestamp)
           ON CONFLICT (plugin_name) DO UPDATE
             SET author_id = cast(:author_id as uuid),
                 description = :description,
                 tags = :tags,
                 uri = :uri,
                 signature = :signature,
                 hash = :hash,
                 updated_at = current_timestamp`,
          {
            plugin_name: plugin.pluginName,
            author_id: authorId,
            description: plugin.description,
            tags: "tags",
            uri: plugin.uri,
            signature: "",
            hash: "",
            status_id: statusId
          }
        )
      } catch (e) {
        Logger.error(e);
      }
    }
  }
}
