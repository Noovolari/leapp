module.exports = {
  cli: {
    name: 'set-pro-environment',
    description: 'Set the environment in production mode (disable monorepo dependencies symlinks)',
    version: '0.1',
    arguments: [],
  },
  run: async () => {
    const leappCoreBootstrap = require('./leapp-core-bootstrap')
    const packageNames = ['desktop-app', 'cli']
    try {
      for (const packageName of packageNames) {
        console.log(`disabling monorepo dependencies symlinks for ${packageName}...`)
        await leappCoreBootstrap(packageName, (corePackage) => corePackage['version']);
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  },
}
