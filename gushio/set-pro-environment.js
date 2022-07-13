module.exports = {
  cli: {
    name: 'set-pro-environment',
    description: 'Set the environment in production mode (disable monorepo dependencies symlinks)',
    version: '0.1',
    arguments: [],
  },
  run: async () => {
    const path = require('path')
    const readPackageJsonFunction = require('./read-package-json-func')
    const writePackageJsonFunction = require('./write-package-json-func')
    const packageNames = ['desktop-app', 'cli']

    try {
      for (const packageName of packageNames) {
        console.log(`disabling monorepo dependencies symlinks for ${packageName}...`)
        const packageToModify = await readPackageJsonFunction(path, packageName)
        const corePackage = await readPackageJsonFunction(path, 'core')
        packageToModify['dependencies'][corePackage['name']] = corePackage['version']
        await writePackageJsonFunction(path, packageName, packageToModify)
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  },
}
