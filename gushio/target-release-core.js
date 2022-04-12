module.exports = {
  cli: {
    name: 'release-core',
    description: 'Release the leapp-core library on NPM and updates the dependencies',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const syncDepCoreVersions = require('./sync-dep-core-version-func')

    try {
      await gushio.run(path.join(__dirname, '../packages/core/gushio/target-release.js'))

      console.log('updating leapp-core dependencies versions... ')
      await syncDepCoreVersions(path, shellJs)
      console.log('leapp-core dependencies versions updated')
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  }
}
