"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
let environment;
exports.environment = environment;
// handling sandbox environment using dev as default
try {
    exports.environment = environment = require(`./environment.${process.env.ENVIRONMENT_NAME}`).environment;
}
catch (e) {
    exports.environment = environment = require("./environment.dev").environment;
}
//# sourceMappingURL=environment.js.map