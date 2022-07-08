import * as http from "http";
import * as bodyParser from "body-parser";
import { environment } from "./environments/environment";
import * as fs from "fs";
import serverlessExpress from "@vendia/serverless-express";
import { RegisterRoutes } from "./generated/routes";
import express from "express";
import { ResponseDto } from "./dto/response.dto";
import { HTTPStatusCodeEnum } from "./enum/http-status-code.enum";

const port = 3100;

let localServer: http.Server;

const app = express();

const generateSwagger = (): void => {
  const execSync = require("child_process").execSync;
  process.stdout.write(execSync(`npm run swagger`).toString());
  fs.writeFileSync(`${__dirname}/generated/swagger.json`, fs.readFileSync(`${__dirname}/generated/swagger.json`));
};

const publishSwagger = (): void => {
  try {
    app.use("/api-docs", (_: express.Request, resp: express.Response, __: () => void) => {
      resp.sendFile(`${__dirname}/generated/swagger.json`);
    });
    console.log("Swagger generated at /api-docs");
  } catch (e) {
    console.log("Swagger not loaded in the ui\n");
  }
};

if (!environment.production) {
  publishSwagger();
}

app.use((req: express.Request, res: express.Response, next: () => void) => {
  res.append("Access-Control-Allow-Methods", ["GET", "POST", "PUT", "OPTIONS", "DELETE", "HEAD", "PATCH"]);
  res.append("Access-Control-Allow-Origin", "*");
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Access-Control-Allow-Headers", ["*"]);
  console.log(`Received ${req.path} ${req.method} request`);
  console.log(`Source IP: ${req.ip}`);
  next();
});

const startLocalServer = (): void => {
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

RegisterRoutes(app);

if (environment.isLocal) {
  startLocalServer();
  localServer.on("close", startLocalServer);
  const stdin = process.stdin;

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  stdin.on("data", (key: string) => {
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

app.use((err: unknown, _: express.Request, res: express.Response, next: express.NextFunction): express.Response | void => {
  if (err instanceof Error) {
    let errorBody: ResponseDto = {
      httpStatusCode: HTTPStatusCodeEnum.internalServerError,
      message: "Internal Server Error",
      details: err.message,
    };

    // Adding stacktrace in not prod environment
    if (!environment.production) {
      errorBody = {
        ...errorBody,
        stack: err.stack,
      };
    }
    return res.status(errorBody.httpStatusCode).json(errorBody);
  }
  next();
});

exports.handler = serverlessExpress({ app });
