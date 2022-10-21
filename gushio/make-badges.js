module.exports = {
  cli: {
    name: 'make-badges',
    description: 'Make coverage badges for the README.md file',
    version: '0.1',
    arguments: [
      {name: '<target>', choices: ['core', 'cli', 'desktop-app', 'all']},
    ],
  },
  run: async (args) => {
    const shellJs = require('shelljs');
    const currentPath = shellJs.pwd();
    let result;
    try {
      if(args[1] === 'core' || args[0] == 'all') {
        // Core badge
        result = shellJs.exec('cd packages/core && npm run test');
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
        result = shellJs.exec('npx coverage-badges --source packages/core/coverage/coverage-summary.json --label "core coverage"');
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
        result = shellJs.exec('mv coverage/badges.svg coverage/core-badges.svg');
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      }

      if(args[1] === 'cli' || args[0] == 'all') {
        // Cli badge
        result = shellJs.exec('cd packages/cli && npm run test');
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
        result = shellJs.exec('npx coverage-badges --source packages/cli/coverage/coverage-summary.json --label "cli coverage"');
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
        result = shellJs.exec('mv coverage/badges.svg coverage/cli-badges.svg');
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      }
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  },
}
