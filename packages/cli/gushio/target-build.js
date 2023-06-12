module.exports = {
  cli: {
    name: 'build',
    description: 'Build the leapp CLI',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const fs = require("fs");
    const compileFunction = require('./compile-func')

    try {
      await gushio.run(path.join(__dirname, './target-clean.js'))
      console.log('Building leapp CLI... ')

      const teamServiceStubFile = path.join(__dirname, '../src/service/team-service-stub.ts')
      const teamServiceTargetFile = path.join(__dirname, '../src/service/team-service.ts')
      if (!fs.existsSync(teamServiceTargetFile)) {
        fs.copyFileSync(teamServiceStubFile, teamServiceTargetFile)
      }

      await compileFunction(path, shellJs)

      console.log('Build completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  },
}
