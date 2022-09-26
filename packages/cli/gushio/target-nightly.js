const readPackageJsonFunction = require("../../../gushio/read-package-json-func");
const writePackageJsonFunction = require("../../../gushio/write-package-json-func");
const leappCoreBootstrap = require("../../../gushio/leapp-core-bootstrap");
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
    const leappCoreBoostrap = require('../../../gushio/leapp-core-bootstrap')

    let cliPackage;
    let originalPackage;

    try {
      console.log('reading leapp Cli... ')
      const jsDate = new Date();
      const date = jsDate.getFullYear() +
                   ('0' + (jsDate.getMonth() + 1)).slice(-2) +
                   ('0' + (jsDate.getDate())).slice(-2) +
                   ('0' + (jsDate.getHours())).slice(-2) +
                   ('0' + (jsDate.getMinutes())).slice(-2);

      cliPackage = await readPackageJsonFunction(path, "cli");
      originalPackage = JSON.parse(JSON.stringify(cliPackage));

      cliPackage["name"] = `@mush-ko-li/leapp-cli-nightly`;
      cliPackage["version"] = cliPackage["version"] + `-nightly.${date}`;

      await writePackageJsonFunction(path, "cli", cliPackage);
      await leappCoreBootstrap("cli", (corePackage) => `npm:@mush-ko-li/leapp-core-nightly@latest`);

      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec('npm publish')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp cli published on npm')
    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      await writePackageJsonFunction(path, "cli", originalPackage);
    }
  }
}
