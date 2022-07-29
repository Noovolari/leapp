"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ecs_1 = require("@aws-sdk/client-ecs");
const environment_1 = require("./environments/environment");
async function handler(event) {
    console.debug(event);
    await new client_ecs_1.ECSClient(environment_1.environment.REGION).send(new client_ecs_1.RunTaskCommand({
        taskDefinition: "leapp-signer-container:1",
        cluster: "arn:aws:ecs:eu-west-1:198460698501:cluster/leapp-signer",
        launchType: client_ecs_1.LaunchType.FARGATE
    }));
}
exports.handler = handler;
//# sourceMappingURL=app.js.map