"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ecs_1 = require("@aws-sdk/client-ecs");
const environment_1 = require("./environments/environment");
async function handler(event) {
    console.debug(event);
    await new client_ecs_1.ECSClient(environment_1.environment.REGION).send(new client_ecs_1.StartTaskCommand({
        containerInstances: [],
        taskDefinition: "",
        cluster: ""
    }));
}
exports.handler = handler;
//# sourceMappingURL=app.js.map