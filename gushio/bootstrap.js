const path = require("path");
module.exports = {
  cli: {
    name: 'bootstrap',
    description: 'Setup Leapp project package',
    version: '0.1',
    arguments: [],
  },
  run: async (args) => {
    const shellJs = require('shelljs')
    const path = require('path')
    const currentPath = shellJs.pwd()

    try {
      // clean additional directories (dist, ...)
      shellJs.cd(path.join(__dirname, '..'))
      let result = shellJs.exec('npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      const packagesDir = path.join(__dirname, '../packages')

      // clean additional directories (dist, ...)
      shellJs.cd(path.join(packagesDir, 'core'))
      result = shellJs.exec('npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      // clean additional directories (dist, ...)
      shellJs.cd(path.join(packagesDir, 'cli'))
      result = shellJs.exec('npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      // clean additional directories (dist, ...)
      shellJs.cd(path.join(packagesDir, 'desktop-app'))
      result = shellJs.exec('npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  },
}
