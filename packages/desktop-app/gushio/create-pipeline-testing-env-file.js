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
      const jsonText = `export const env = {\n\t"awsIamUserTest": {\n\t\t"accessKeyId": "${envJson.awsIamUserTest.accessKeyId}",\n\t\t"secretAccessKey": "${envJson.awsIamUserTest.secretAccessKey}"\n\t}\n};\n`;
      if(currentOS !== "win32") {
        result = shellJs.exec(`printf '${jsonText}' > ${integrationTestsPath}/.env.ts`);
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      } else {
        result = shellJs.exec(`echo "${jsonText}" > ${integrationTestsPath}/.env.ts`);
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
