
module.exports = {
  cli: {
    name: 'setup',
    description: 'Run npm install on all submodules',
    version: '0.1',
  },
  run: async () => {
    const deleteFunction = require("./delete-func")
    const path = require('path')
    const shellJs = require('shelljs')
    const currentPath = shellJs.pwd()

    try {
      console.log("Cleaning core...");
      await deleteFunction(path, '../core/dist')
      await deleteFunction(path, '../core/node_modules')
      await deleteFunction(path, '../core/package-lock.json')

      console.log("Cleaning cli...");
      await deleteFunction(path, '../cli/dist')
      await deleteFunction(path, '../cli/node_modules')
      await deleteFunction(path, '../cli/oclif.manifest.json')
      await deleteFunction(path, '../cli/package-lock.json')

      console.log("Cleaning desktop-app...");
      await deleteFunction(path, '../desktop-app/dist')
      await deleteFunction(path, '../desktop-app/node_modules')
      await deleteFunction(path, '../desktop-app/package-lock.json')
    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  }
}
