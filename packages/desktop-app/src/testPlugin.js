"use strict";
exports.__esModule = true;
exports.HelloWorldPlugin = void 0;
var HelloWorldPlugin = /** @class */ (function () {
    function HelloWorldPlugin() {
        this.author = "Alessandro Gaggia";
        this.description = "hello world plugin";
        this.name = "Hello World";
        this.supportedOS = ["macOS", "windows", "linux"];
        this.tags = ["leapp", "hello world"];
    }
    HelloWorldPlugin.prototype.boostrap = function (session, pluginCoreService) {
        this.session = session;
        this.pluginCoreService = pluginCoreService;
        this.templateStructure = { form: [], output: { type: pluginCoreService.outputType.message, data: "myHelloWorldMessage" } };
    };
    HelloWorldPlugin.prototype.applyAction = function () {
        this.helloWorldMessage = "Hello from plugin TestPlugin with session: " + this.session.sessionName;
    };
    HelloWorldPlugin.prototype.myHelloWorldMessage = function () {
        return this.helloWorldMessage;
    };
    return HelloWorldPlugin;
}());
exports.HelloWorldPlugin = HelloWorldPlugin;
