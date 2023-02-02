module.exports = {
  cli: {
    name: 'clean',
    description: 'Cleanup all files built previously',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const deleteFunction = require('./delete-func')

    try {
      console.log('Performing cleanup... ')
      await deleteFunction(path, "..", "electron", "dist")
      await deleteFunction(path, "..", "dist", "leapp-client")
      await deleteFunction(path, "..", "coverage")
      await deleteFunction(path, "..", ".angular")
      console.log('Cleanup completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  },
}
