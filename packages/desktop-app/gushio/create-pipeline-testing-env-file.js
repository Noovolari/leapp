module.exports = {
  cli: {
    name: 'create pipeline env',
    description: 'Create pipeline env file for integration test, wants a string retrieved from github action secret',
    version: '0.1',
    arguments: [{ name: "<env_secret>", description: "the github action secret" },],
  },
  run: async (args) => {
    const [env_secret] = args;
    const envJson = JSON.parse(env_secret);
    const path = require("path");
    const shellJs = require('shelljs');
    const os = require('os');
    const currentOS = os.platform();
    const integrationTestsPath = path.join(__dirname, "..", "integration-tests");

    try {
      let result;
      if(currentOS !== "win32") {
        const jsonText = `JSON_TEST_ENV='export const env = {\n\t"awsIamUserTest": {\n\t\t"accessKeyId": "%s",\n\t\t"secretAccessKey": "%s"\n\t}\n};\n'`
        result = shellJs.exec(`${jsonText} && printf "$JSON_TEST_ENV" "${envJson.awsIamUserTest.accessKeyId}" "${envJson.awsIamUserTest.secretAccessKey}" > ${integrationTestsPath}/.env.ts`);
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
