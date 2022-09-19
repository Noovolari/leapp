module.exports = {
  cli: {
    name: 'create pipeline env',
    description: 'Create pipeline env file for integration test, wants a string retrieved from github action secret',
    version: '0.1',
    arguments: [{ name: "<env_secret>", description: "the github action secret" },],
  },
  run: async (args) => {
    const envJson = JSON.parse(args.env_secret);
    const path = require("path");
    const shellJs = require('shelljs');
    const currentOS = os.platform();
    const integrationTestsPath = path.join(__dirname, "..", "integration-tests");

    try {
      let result;
      if(currentOS !== "win32") {
        result = shellJs.exec(`JSON_TEST_ENV='export const env = {
          "awsIamUserTest": {
            "accessKeyId": "%s",
            "secretAccessKey": "%s"
          }
        };'`);
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
        result = shellJs.exec(`printf "JSON_TEST_ENV" "${envJson.awsIamUserTest.accessKeyId}" "${envJson.awsIamUserTest.secretAccessKey}" > ${integrationTestsPath}/.env.ts`);
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      } else {
        result = null;
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  },
}
