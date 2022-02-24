module.exports = {
  cli: {
    name: 'build',
    description: 'Build and run leapp desktop app',
    version: '0.1',
    arguments: [
      {name: '<target>', choices: ['aot', 'configuration production']},
    ],
  },
  run: async (args) => {
    const path = require('path')
    const shellJs = require('shelljs')
    try {
      await gushio.run(path.join(__dirname, './target-build.js'), ...args)

      console.log('Launching leapp... ')
      const result = shellJs.exec('electron --enable-accelerated-mjpeg-decode --enable-accelerated-video --ignore-gpu-blacklist --enable-native-gpu-memory-buffers --enable-gpu-rasterization --ignore-gpu-blacklist .')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      console.error(e.message.red)
    }
  },
}
