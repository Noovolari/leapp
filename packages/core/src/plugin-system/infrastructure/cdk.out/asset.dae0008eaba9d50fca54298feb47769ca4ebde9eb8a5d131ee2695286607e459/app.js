"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("./core/logger");
const axios = __importStar(require("axios"));
const plugin_converter_1 = require("./converter/plugin.converter");
const plugin_updater_service_1 = require("./service/plugin-updater.service");
const environment_1 = require("./environments/environment");
async function handler(event) {
    const npmPackagesDto = (await axios.default.request({
        baseURL: "https://registry.npmjs.org/-/v1/",
        url: "search",
        method: "GET",
        params: { text: "leapp-plugin" }
    })).data;
    logger_1.Logger.debug(npmPackagesDto);
    const pluginConverter = new plugin_converter_1.PluginConverter();
    await new plugin_updater_service_1.PluginUpdaterService(environment_1.environment.REGION).updateRds(npmPackagesDto.map((npmPackage) => pluginConverter.toModel(npmPackage)));
}
exports.handler = handler;
//# sourceMappingURL=app.js.map