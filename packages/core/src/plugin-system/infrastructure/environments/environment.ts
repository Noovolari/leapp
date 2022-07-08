let environment: {
  privateSubnetIds: string[];
  [key: string]: any
};

// handling sandbox environment using dev as default
try {
  environment = require(`./environment.${process.env.ENVIRONMENT_NAME}`).environment;
} catch (e) {
  environment = require("./environment.dev").environment;
}

export { environment };
