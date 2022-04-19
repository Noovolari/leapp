module.exports = {
  cli: {
    name: 'release',
    description: 'Release the leapp-cli tool on NPM',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const checkNpmCoreVersion = require('./check-npm-core-version')

    try {
      console.log('Publishing leapp-cli tool... ')

      await checkNpmCoreVersion(path, shellJs)

      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec('npm publish')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp-cli published on npm successfully')
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  }
}
