const fs = require("fs");

module.exports = async () => {
  if (process.env.LEAPP_CLI_TEST_HOME) {
    fs.rmSync(process.env.LEAPP_CLI_TEST_HOME, { recursive: true, force: true });
  }
};
