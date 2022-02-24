const path = require('path')
module.exports = {
  cli: {
    name: 'build',
    description: 'Build distributable leapp desktop app package',
    version: '0.1',
    arguments: [
      {name: '<target>', choices: ['aot', 'configuration production']},
      {name: '<platform-version>', choices: ['mac', 'linux', 'win', 'all']},
    ],
  },
  run: async (args) => {
    const path = require('path')
    const shellJs = require('shelljs')
    try {
      await gushio.run(path.join(__dirname, './target-build.js'), args[0].replace(' ', '\\ '))

      console.log('Packaging leapp... ')
      const platformVersion = args[1] === 'mac'
        ? ''
        : args[1] === 'win'
          ? '--win --x64'
          : args[1] === 'linux'
            ? '--linux'
            : '--mac --win --linux'

      const result = shellJs.exec(`electron-builder build ${platformVersion}`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log('Package generation completed successfully')
    } catch (e) {
      console.error(e.message.red)
    }
  },
}
