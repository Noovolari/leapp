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

    const currentPath = shellJs.pwd()

    try {
      // target-build.js takes only the build target; gushio 0.7.5 rejects extra arguments
      await gushio.run(path.join(__dirname, './target-build.js'), [args[0]])

      console.log('Packaging leapp... ')
      // Package.json says leappFlavor dev; a release is always prod
      const platformVersion = args[1] === 'mac'
        ? ''
        : args[1] === 'win'
          ? '--win --x64'
          : args[1] === 'linux'
            ? '--linux'
            : '--mac --win --linux'

      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec(`electron-builder build ${platformVersion} --publish never -c.extraMetadata.leappFlavor=prod`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log('Package generation completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  },
}
