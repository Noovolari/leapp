const getNightlyVersion = require("../../../gushio/get-nightly-version");
module.exports = {
  cli: {
    name: 'nightly',
    description: 'Release the leapp Desktop app under the branch Nightly',
    version: '0.1',
    arguments: [
      {name: '<platform-version>', choices: ['mac', 'linux', 'win', 'all']},
    ],
  },
  deps: [],
  run: async (args) => {
    const path = await gushio.import('path')
    const shellJs = await gushio.import('shelljs')
    const readPackageJsonFunction = require('../../../gushio/read-package-json-func')
    const writePackageJsonFunction = require('../../../gushio/write-package-json-func')
    const leappCoreBootstrap = require('../../../gushio/leapp-core-bootstrap')
    const getNightlyVersion = require('../../../gushio/get-nightly-version')

    let desktopAppPackage;
    let originalPackage;

    try {
      console.log('Reading leapp Desktop app package.json... ')
      desktopAppPackage = await readPackageJsonFunction(path, "desktop-app");
      originalPackage = JSON.parse(JSON.stringify(desktopAppPackage));

      let nightlyVersion = desktopAppPackage["version"];
      if (desktopAppPackage["version"].indexOf("-nightly.") === -1) {
          nightlyVersion += `-nightly.${getNightlyVersion(false)}`;
      }
      await fs.writeFile(path.join(__dirname, '..', 'nightly-version'), nightlyVersion);
      desktopAppPackage["version"] = nightlyVersion;

      await writePackageJsonFunction(path, "desktop-app", desktopAppPackage);
      await leappCoreBootstrap("desktop-app", () => `npm:@noovolari/leapp-core-nightly@latest`);

      await gushio.run(path.join(__dirname, './target-release-dev.js'), ["configuration staging", args[0]])
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      await writePackageJsonFunction(path, "desktop-app", originalPackage);
    }
  }
}
