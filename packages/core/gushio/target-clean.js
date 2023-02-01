module.exports = {
  cli: {
    name: 'clean',
    description: 'Cleanup all files built previously',
    version: '0.1'
  },
  run: async () => {
    const path = require('path')
    const deleteFunction = require('./delete-func')

    try {
      console.log('Performing cleanup... ')
      await deleteFunction(path, "..", "dist")
      await deleteFunction(path, "..", "coverage")
      console.log('Cleanup completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  }
}
