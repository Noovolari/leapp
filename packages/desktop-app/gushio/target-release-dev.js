module.exports = {
  cli: {
    name: 'build',
    description: 'Build distributable leapp desktop app package',
    version: '0.1',
    arguments: [
      {name: '<target>', choices: ['aot', 'configuration staging']},
      {name: '<platform-version>', choices: ['mac', 'linux', 'win', 'all']},
    ],
  },
  run: async (args) => {
    const path = require('path')
    const shellJs = require('shelljs')
    const readPackageJsonFunction = require("../../../gushio/read-package-json-func");
    const writePackageJsonFunction = require("../../../gushio/write-package-json-func");
    const currentPath = shellJs.pwd()
    let originalPackage;

    try {
      const packageJson = await readPackageJsonFunction(path, "desktop-app");
      originalPackage = JSON.parse(JSON.stringify(packageJson));
      await gushio.run(path.join(__dirname, './target-build.js'), args)

      console.log('Packaging leapp... ')
      const platformVersion = args[1] === 'mac'
        ? ''
        : args[1] === 'win'
          ? '--win --x64'
          : args[1] === 'linux'
            ? '--linux'
            : '--mac --win --linux'

      shellJs.cd(path.join(__dirname, '..'));

      packageJson["build"]["mac"]["forceCodeSigning"] = false;
      delete packageJson["build"]["win"]["signingHashAlgorithms"];
      delete packageJson["build"]["win"]["sign"];
      await writePackageJsonFunction(path, "desktop-app", packageJson);

      let command;
      if (args[1] === 'mac') {
        command = `export CSC_IDENTITY_AUTO_DISCOVERY=true && electron-builder build ${platformVersion}`;
      } else {
        command = `electron-builder build ${platformVersion}`;
      }
      const result = shellJs.exec(command);
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log('Package generation completed successfully')
    } catch (e) {
      e.message = e.stack.red
      throw e
    } finally {
      await writePackageJsonFunction(path, "desktop-app", originalPackage);
      shellJs.cd(currentPath)
    }
  },
}
