"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginUpdaterService = void 0;
const service_1 = require("../core/service");
const data_api_connector_1 = require("../database/data-api-connector");
const logger_1 = require("../core/logger");
const plugin_converter_1 = require("../converter/plugin.converter");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const environment_1 = require("../environments/environment");
class PluginUpdaterService extends service_1.Service {
    constructor(region) {
        super(region);
        this.dataApiConnector = new data_api_connector_1.DataApiConnector();
    }
    async updateRds(npmPackagesDto) {
        for (const npmPackage of npmPackagesDto) {
            try {
                await this.sqs.send(new client_sqs_1.SendMessageCommand({
                    QueueUrl: environment_1.environment.QUEUE_URL,
                    MessageBody: JSON.stringify(npmPackage)
                }));
            }
            catch (e) {
                logger_1.Logger.error(e);
            }
        }
        const pluginConverter = new plugin_converter_1.PluginConverter();
        const pluginModelList = npmPackagesDto.map((npmPackage) => pluginConverter.toModel(npmPackage));
        for (const plugin of pluginModelList) {
            try {
                const authorId = (await this.dataApiConnector.executeStatement(`INSERT INTO author(name, email)
           VALUES (:name, :email)
           ON CONFLICT (name) DO UPDATE
             SET email = :email
           RETURNING id`, {
                    name: plugin.author.name,
                    email: plugin.author.email
                })).records[0].id;
                const statusId = (await this.dataApiConnector.executeStatement(`SELECT * FROM status WHERE name = :name`, {
                    name: 'pending'
                })).records[0].id;
                await this.dataApiConnector.executeStatement(`INSERT INTO plugin(plugin_name, author_id, description, tags, uri, signature, hash, status_id, created_at, updated_at)
           VALUES (:plugin_name, cast(:author_id as uuid), :description, :tags, :uri, :signature, :hash, cast(:status_id as uuid), current_timestamp, current_timestamp)
           ON CONFLICT (plugin_name) DO UPDATE
             SET author_id = cast(:author_id as uuid),
                 description = :description,
                 tags = :tags,
                 uri = :uri,
                 signature = :signature,
                 hash = :hash,
                 updated_at = current_timestamp`, {
                    plugin_name: plugin.pluginName,
                    author_id: authorId,
                    description: plugin.description,
                    tags: "tags",
                    uri: plugin.uri,
                    signature: "",
                    hash: "",
                    status_id: statusId
                });
            }
            catch (e) {
                logger_1.Logger.error(e);
            }
        }
    }
}
exports.PluginUpdaterService = PluginUpdaterService;
//# sourceMappingURL=plugin-updater.service.js.map