"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const environment_1 = require("../environments/environment");
class Logger {
    static debug(message, ...optionalParams) {
        if (environment_1.environment.name === "local" ||
            environment_1.environment.name === "dev" ||
            environment_1.environment.name === "test") {
            console.debug("[" + new Date().toISOString() + "] - DEBUG - ", message, ...optionalParams);
        }
    }
    static info(message, ...optionalParams) {
        console.info("[" + new Date().toISOString() + "] - INFO - ", message, ...optionalParams);
    }
    static warn(message, ...optionalParams) {
        console.warn("[" + new Date().toISOString() + "] - WARN - ", message, ...optionalParams);
    }
    static error(message, ...optionalParams) {
        console.error("[" + new Date().toISOString() + "] - ERROR - ", message, ...optionalParams);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map