module.exports = {
  cli: {
    name: 'release',
    description: 'Release the leapp-core library on NPM',
    version: '0.1',
  },
  deps: [],
  run: async () => {
    const path = await gushio.import('path')
    const shellJs = await gushio.import('shelljs')

    try {
      console.log('Publishing leapp-core library... ')

      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec('npm publish')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp-core published on npm')
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  }
}
