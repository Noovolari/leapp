module.exports = {
  cli: {
    name: 'setup-package',
    description: 'Setup Leapp project package',
    version: '0.1',
    arguments: [
      {name: '[packages...]'},
    ],
  },
  run: async (args) => {
    const shellJs = require('shelljs')
    const path = require('path')
    const deleteFunction = require('./delete-func')
    const currentPath = shellJs.pwd()
    const packageNames = args[0]

    try {

      for (const packageName of packageNames) {
        console.log(`cleaning ${packageName}...`)

        // remove "node-modules" directory
        console.log(`removing ${packageName} node_modules...`)
        await deleteFunction(path, `../packages/${packageName}/node_modules`)

        // remove "package-lock.json" file
        console.log(`removing ${packageName} package-lock.json...`)
        await deleteFunction(path, `../packages/${packageName}/package-lock.json`)

        // clean additional directories (dist, ...)
        shellJs.cd(path.join(__dirname, '../packages', packageName))
        let result = shellJs.exec('npm run clean')
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      }

      console.log('\n\n')
      console.log('installing dependencies ...')
      // install npm dependencies
      shellJs.cd(path.join(__dirname, '..'))
      let result = shellJs.exec(`lerna bootstrap`)
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  },
}
