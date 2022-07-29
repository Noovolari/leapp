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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = __importStar(require("body-parser"));
const environment_1 = require("./environments/environment");
const fs = __importStar(require("fs"));
const serverless_express_1 = __importDefault(require("@vendia/serverless-express"));
const routes_1 = require("./generated/routes");
const express_1 = __importDefault(require("express"));
const http_status_code_enum_1 = require("./enum/http-status-code.enum");
const port = 3100;
let localServer;
const app = (0, express_1.default)();
const generateSwagger = () => {
    const execSync = require("child_process").execSync;
    process.stdout.write(execSync(`npm run swagger`).toString());
    fs.writeFileSync(`${__dirname}/generated/swagger.json`, fs.readFileSync(`${__dirname}/generated/swagger.json`));
};
const publishSwagger = () => {
    try {
        app.use("/api-docs", (_, resp, __) => {
            resp.sendFile(`${__dirname}/generated/swagger.json`);
        });
        console.log("Swagger generated at /api-docs");
    }
    catch (e) {
        console.log("Swagger not loaded in the ui\n");
    }
};
if (!environment_1.environment.production) {
    publishSwagger();
}
app.use((req, res, next) => {
    res.append("Access-Control-Allow-Methods", ["GET", "POST", "PUT", "OPTIONS", "DELETE", "HEAD", "PATCH"]);
    res.append("Access-Control-Allow-Origin", "*");
    res.append("Access-Control-Allow-Credentials", "true");
    res.append("Access-Control-Allow-Headers", ["*"]);
    console.log(`Received ${req.path} ${req.method} request`);
    console.log(`Source IP: ${req.ip}`);
    next();
});
const startLocalServer = () => {
    process.stdout.write("running server\n");
    localServer = app.listen(port, () => {
        console.log(`server started at http://localhost:${port}`);
        console.log("Press r to reload");
        console.log("Press s to update swagger");
        console.log("Press q to quit server");
    });
};
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
(0, routes_1.RegisterRoutes)(app);
if (environment_1.environment.isLocal) {
    startLocalServer();
    localServer.on("close", startLocalServer);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", (key) => {
        switch (key) {
            case "s":
                generateSwagger();
                publishSwagger();
                break;
            case "r":
                localServer.close();
                break;
            case "q":
                process.exit(222);
                break;
            case "\x03":
                process.exit(222);
                break;
        }
    });
    process.on("SIGINT", () => {
        process.exit();
    });
}
app.use((err, _, res, next) => {
    if (err instanceof Error) {
        let errorBody = {
            httpStatusCode: http_status_code_enum_1.HTTPStatusCodeEnum.internalServerError,
            message: "Internal Server Error",
            details: err.message,
        };
        // Adding stacktrace in not prod environment
        if (!environment_1.environment.production) {
            errorBody = {
                ...errorBody,
                stack: err.stack,
            };
        }
        return res.status(errorBody.httpStatusCode).json(errorBody);
    }
    next();
});
exports.handler = (0, serverless_express_1.default)({ app });
//# sourceMappingURL=app.js.map