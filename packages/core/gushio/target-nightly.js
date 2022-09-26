const readPackageJsonFunction = require("../../../gushio/read-package-json-func");
const writePackageJsonFunction = require("../../../gushio/write-package-json-func");
module.exports = {
  cli: {
    name: 'nightly',
    description: 'Release the leapp-core library on NPM under the branch Nightly',
    version: '0.1',
  },
  deps: [],
  run: async () => {
    const path = await gushio.import('path')
    const shellJs = await gushio.import('shelljs')
    const readPackageJsonFunction = require('../../../gushio/read-package-json-func')
    const writePackageJsonFunction = require('../../../gushio/write-package-json-func')
    let corePackage;
    let originalPackage;

    try {
      console.log('reading leapp-core library... ')
      const jsDate = new Date();
      const date = jsDate.getFullYear() +
                   ('0' + (jsDate.getMonth() + 1)).slice(-2) +
                   ('0' + (jsDate.getDate())).slice(-2) +
                   ('0' + (jsDate.getHours())).slice(-2) +
                   ('0' + (jsDate.getMinutes())).slice(-2);

      corePackage = await readPackageJsonFunction(path, "core");
      originalPackage = JSON.parse(JSON.stringify(corePackage));

      corePackage["name"] = `@mush-ko-li/leapp-core-nightly`;
      corePackage["version"] = corePackage["version"] + `-nightly.${date}`;

      await writePackageJsonFunction(path, "core", corePackage);

      shellJs.cd(path.join(__dirname, '..'))
      const result = shellJs.exec('npm publish')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp-core published on npm')
    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      await writePackageJsonFunction(path, "core", originalPackage);
    }
  }
}
