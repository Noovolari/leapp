"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureUpdaterService = void 0;
const service_1 = require("../core/service");
const data_api_connector_1 = require("../database/data-api-connector");
class SignatureUpdaterService extends service_1.Service {
    constructor(region) {
        super(region);
        this.dataApiConnector = new data_api_connector_1.DataApiConnector();
    }
    async updateRds(pluginName, hash, signature) {
        await this.dataApiConnector.executeStatement(`UPDATE plugin
       SET hash = :hash,
           signature = :signature
       WHERE plugin_name = :plugin_name`, {
            plugin_name: pluginName,
            hash: hash,
            signature: signature
        });
    }
}
exports.SignatureUpdaterService = SignatureUpdaterService;
//# sourceMappingURL=signature-updater.service.js.map