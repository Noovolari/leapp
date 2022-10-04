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
      let result = shellJs.exec("npx jest -t \"my integration test 1\" --runInBand");
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      result = shellJs.exec("npx jest -t \"create session\" --runInBand");
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  }
}
