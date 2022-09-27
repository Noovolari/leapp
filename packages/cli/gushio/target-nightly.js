module.exports = {
  cli: {
    name: 'nightly',
    description: 'Release the leapp Cli on NPM under the branch Nightly',
    version: '0.1',
  },
  deps: [],
  run: async () => {
    const path = await gushio.import('path')
    const shellJs = await gushio.import('shelljs')
    const readPackageJsonFunction = require('../../../gushio/read-package-json-func')
    const writePackageJsonFunction = require('../../../gushio/write-package-json-func')
    const leappCoreBootstrap = require('../../../gushio/leapp-core-bootstrap')
    const getNightlyVersion = require('../../../gushio/get-nightly-version')

    let cliPackage;
    let originalPackage;

    try {
      console.log('Reading leapp Cli package.json... ')
      cliPackage = await readPackageJsonFunction(path, "cli");
      originalPackage = JSON.parse(JSON.stringify(cliPackage));

      cliPackage["name"] = `@mush-ko-li/leapp-cli-nightly`;
      cliPackage["version"] = cliPackage["version"] + `-nightly.${getNightlyVersion()}`;

      await writePackageJsonFunction(path, "cli", cliPackage);
      await leappCoreBootstrap("cli", () => `npm:@mush-ko-li/leapp-core-nightly@latest`);

      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec('npm publish')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp cli published on npm')
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      await writePackageJsonFunction(path, "cli", originalPackage);
    }
  }
}
