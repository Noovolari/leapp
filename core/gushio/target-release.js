module.exports = {
  cli: {
    name: 'release',
    description: 'Prepare and release the leapp-core library on NPM',
    version: '0.1',
  },
  deps: [{name: 'semver', version: '^7.3.5'}],
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const semver = require('semver')
    const bumpVersionFunction = require('./bump-func')

    try {
      console.log('Publishing leapp-core library... ')
      await bumpVersionFunction(path, semver)

      await gushio.run(path.join(__dirname, './target-build.js'))

      shellJs.cd(path.join(__dirname, '../dist'))
      const result = shellJs.exec('npm publish --access public')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp-core published on npm successfully')
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  }
}
