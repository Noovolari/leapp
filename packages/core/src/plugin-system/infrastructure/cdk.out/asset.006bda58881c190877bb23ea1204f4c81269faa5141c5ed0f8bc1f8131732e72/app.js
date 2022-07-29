"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("./core/logger");
const signature_updater_service_1 = require("./service/signature-updater.service");
const environment_1 = require("./environments/environment");
async function handler(event) {
    logger_1.Logger.debug(event);
    await new signature_updater_service_1.SignatureUpdaterService(environment_1.environment.REGION).updateRds(event.pluginName, event.hash, event.signature);
}
exports.handler = handler;
//# sourceMappingURL=app.js.map