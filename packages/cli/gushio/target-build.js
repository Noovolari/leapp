const path = require("path");
module.exports = {
  cli: {
    name: 'build',
    description: 'Build the leapp CLI',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const compileFunction = require('./compile-func')

    try {
      await gushio.run(path.join(__dirname, './target-clean.js'))

      console.log('Building leapp CLI... ')
      await compileFunction(path, shellJs)

      console.log('Build completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  },
}
