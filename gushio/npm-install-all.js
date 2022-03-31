module.exports = {
  cli: {
    name: 'setup',
    description: 'Run npm install on all submodules',
    version: '0.1',
  },
  run: async () => {
    const shellJs = require('shelljs')
    const path = require('path')
    const currentPath = shellJs.pwd()

    try {
      console.log("core")
      shellJs.cd(path.join(__dirname, '../core'))
      let result = shellJs.exec('npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("cli")
      shellJs.cd(path.join(__dirname, '../cli'))
      result = shellJs.exec('npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("desktop app")
      shellJs.cd(path.join(__dirname, '../desktop-app'))
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
  }
}
