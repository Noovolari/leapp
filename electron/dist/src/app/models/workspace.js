"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspace = void 0;
var session_1 = require("./session");
var uuid = require("uuid");
var environment_1 = require("../../environments/environment");
var class_transformer_1 = require("class-transformer");
var Workspace = /** @class */ (function () {
    function Workspace() {
        this._idpUrl = [];
        this._profiles = [
            { id: uuid.v4(), name: environment_1.environment.defaultAwsProfileName },
            { id: uuid.v4(), name: environment_1.environment.defaultAzureProfileName }
        ];
        this._sessions = [];
        this._defaultRegion = environment_1.environment.defaultRegion;
        this._defaultLocation = environment_1.environment.defaultLocation;
    }
    Object.defineProperty(Workspace.prototype, "defaultLocation", {
        get: function () {
            return this._defaultLocation;
        },
        set: function (value) {
            this._defaultLocation = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Workspace.prototype, "defaultRegion", {
        get: function () {
            return this._defaultRegion;
        },
        set: function (value) {
            this._defaultRegion = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Workspace.prototype, "proxyConfiguration", {
        get: function () {
            return this._proxyConfiguration;
        },
        set: function (value) {
            this._proxyConfiguration = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Workspace.prototype, "profiles", {
        get: function () {
            return this._profiles;
        },
        set: function (value) {
            this._profiles = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Workspace.prototype, "idpUrl", {
        get: function () {
            return this._idpUrl;
        },
        set: function (value) {
            this._idpUrl = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Workspace.prototype, "sessions", {
        get: function () {
            return this._sessions;
        },
        set: function (value) {
            this._sessions = value;
        },
        enumerable: false,
        configurable: true
    });
    __decorate([
        class_transformer_1.Type(function () { return session_1.Session; }),
        __metadata("design:type", Array)
    ], Workspace.prototype, "_sessions", void 0);
    return Workspace;
}());
exports.Workspace = Workspace;
//# sourceMappingURL=workspace.js.map