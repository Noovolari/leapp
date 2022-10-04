module.exports = {
  cli: {
    name: 'integration tests',
    description: 'Run integration tests for desktop-app',
    version: '0.1',
    arguments: [],
  },
  run: async (_) => {
    const path = require('path');
    const shellJs = require('shelljs');
    try {
      console.log('Rebuilding app && Executing integration tests...');
      await gushio.run(path.join(__dirname, './target-build.js'), ['aot']);
      const result = shellJs.exec("npx jest --runInBand");
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  }
}
