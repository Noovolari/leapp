module.exports = {
  cli: {
    name: 'integration tests',
    description: 'Run integration tests for desktop-app',
    version: '0.1',
    arguments: [],
  },
  run: async (_) => {
    const path = require('path');
    const os = require('os');
    const shellJs = require('shelljs');

    try {
      console.log('Rebuilding app && Executing integration tests...');
      await gushio.run(path.join(__dirname, './target-build.js'), ['aot']);

      const rootPath = path.join(__dirname, "..");
      const currentOS = os.platform();
      const macCommand = `${rootPath}/node_modules/.bin/chromedriver & npx jest && pkill chromedriver`;
      const winCommand = `start /min ${rootPath}\\node_modules\\.bin\\chromedriver.cmd && npx jest && taskkill /f /im chromedriver.exe`;
      const linCommand = `${rootPath}/node_modules/.bin/chromedriver & npx jest && pkill chromedriver`;

      const command = {
        darwin: macCommand,
        win32: winCommand,
        linux: linCommand,
      };

      let result = shellJs.exec(command[currentOS]);
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  },
}
