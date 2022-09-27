module.exports = {
  cli: {
    name: 'clean',
    description: 'Post pack actions',
    version: '0.1'
  },
  run: async () => {
    const path = require('path')
    const deleteFunction = require('./delete-func')

    try {
      console.log('Performing post-pack actions... ')
      await deleteFunction(path, "..", "oclif.manifest.json")
      console.log('post-pack actions completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  }
}
