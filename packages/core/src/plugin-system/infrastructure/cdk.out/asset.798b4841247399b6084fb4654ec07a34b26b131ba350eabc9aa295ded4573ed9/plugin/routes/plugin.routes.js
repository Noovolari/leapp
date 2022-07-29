"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRoutes = void 0;
const runtime_1 = require("@tsoa/runtime");
const plugin_service_1 = require("../service/plugin.service");
const environment_1 = require("../../environments/environment");
const plugin_converter_1 = require("../converter/plugin.converter");
let PluginRoutes = class PluginRoutes {
    constructor() {
        this.pluginService = new plugin_service_1.PluginService(environment_1.environment.REGION);
        this.pluginConverter = new plugin_converter_1.PluginConverter();
    }
    async pluginList(q) {
        console.log("List plugin");
        return this.pluginConverter.toListDto(await this.pluginService.listPlugin(q));
    }
    async getPlugin(pluginId) {
        console.log("Get plugin");
        return this.pluginConverter.toDto(await this.pluginService.getPlugin(pluginId));
    }
    async createPlugin() {
        console.log("Created plugin");
    }
    async updatePlugin() {
        console.log("Update plugin");
    }
};
__decorate([
    (0, runtime_1.Get)(""),
    __param(0, (0, runtime_1.Query)('q'))
], PluginRoutes.prototype, "pluginList", null);
__decorate([
    (0, runtime_1.Get)("{pluginId}"),
    __param(0, (0, runtime_1.Path)("pluginId"))
], PluginRoutes.prototype, "getPlugin", null);
__decorate([
    (0, runtime_1.Post)()
], PluginRoutes.prototype, "createPlugin", null);
__decorate([
    (0, runtime_1.Put)("{pluginId}")
], PluginRoutes.prototype, "updatePlugin", null);
PluginRoutes = __decorate([
    (0, runtime_1.Route)("v1/plugins"),
    (0, runtime_1.Tags)("plugins")
], PluginRoutes);
exports.PluginRoutes = PluginRoutes;
//# sourceMappingURL=plugin.routes.js.map