module.exports = {
  cli: {
    name: 'setup',
    description: 'Setup Leapp project',
    version: '0.1',
  },
  run: async () => {
    const fs = require('fs')
    const shellJs = require('shelljs')

    let result = shellJs.exec('npm show @noovolari/leapp-core version').slice(0, -1)

    const cliPackageJson = JSON.parse(fs.readFileSync("cli/package.json"));
    const cliCoreDependencyValue = cliPackageJson["dependencies"]["@noovolari/leapp-core"];

    if (cliCoreDependencyValue.indexOf("file:") !== -1) {
      //throw new Error("CLI depends on a local @noovolari/leapp-core build. Set it to the latest version available in https://www.npmjs.com/package/@noovolari/leapp-core");
      cliPackageJson["dependencies"]["@noovolari/leapp-core"] = result;
      fs.writeFileSync("cli/package.json", JSON.stringify(cliPackageJson, null, 2))
    }

    const desktopAppPackageJson = JSON.parse(fs.readFileSync("desktop-app/package.json"));
    const desktopAppCoreDependencyValue = desktopAppPackageJson["dependencies"]["@noovolari/leapp-core"];
    if (desktopAppCoreDependencyValue.indexOf("file:") !== -1) {
      //throw new Error("Desktop App depends on a local @noovolari/leapp-core build. Set it to the latest version available in https://www.npmjs.com/package/@noovolari/leapp-core");
      desktopAppPackageJson["dependencies"]["@noovolari/leapp-core"] = result;
      fs.writeFileSync("desktop-app/package.json", JSON.stringify(desktopAppPackageJson, null, 2))
    }
  }
}
