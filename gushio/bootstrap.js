module.exports = {
  cli: {
    name: 'project-bootstrap',
    description: 'Bootstrap (npm install) every package',
    version: '0.1',
    arguments: [
      {name: '[packages...]'},
    ],
  },
  run: async (args) => {
    const shellJs = require('shelljs')
    const path = require('path')
    const currentPath = shellJs.pwd()
    const packageNames = args[0]

    try {
      for (const packageName of packageNames) {
        console.log('\n\n')
        console.log(`installing dependencies for ${packageName}...`)
        shellJs.cd(path.join(__dirname, '..', 'packages', packageName))
        let result = shellJs.exec('npm install')
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  },
}
