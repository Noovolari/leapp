const fs = require("fs");
const os = require("os");
const path = require("path");

// Tests must never read or write the developer's real ~/.Leapp or ~/.aws:
// every test worker inherits a throwaway HOME created here.
module.exports = async () => {
  const testHome = fs.mkdtempSync(path.join(os.tmpdir(), "leapp-cli-test-home-"));
  process.env.LEAPP_CLI_TEST_HOME = testHome;
  process.env.HOME = testHome;
  process.env.USERPROFILE = testHome;
};
