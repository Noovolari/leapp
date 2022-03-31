module.exports = {
  cli: {
    name: 'setup',
    description: 'Setup Leapp project',
    version: '0.1',
  },
  run: async () => {
    const fs = require('fs')

    const cliPackageJson = JSON.parse(fs.readFileSync("cli/package.json"));
    const cliCoreDependencyValue = cliPackageJson["dependencies"]["@noovolari/leapp-core"];
    if (cliCoreDependencyValue.indexOf("file:") === -1) {
      cliPackageJson["dependencies"]["@noovolari/leapp-core"] = "file:../core/dist";
      fs.writeFileSync("cli/package.json", JSON.stringify(cliPackageJson, null, 2))
    }

    const desktopAppPackageJson = JSON.parse(fs.readFileSync("desktop-app/package.json"));
    const desktopAppCoreDependencyValue = desktopAppPackageJson["dependencies"]["@noovolari/leapp-core"];
    if (desktopAppCoreDependencyValue.indexOf("file:") === -1) {
      desktopAppPackageJson["dependencies"]["@noovolari/leapp-core"] = "file:../core/dist";
      fs.writeFileSync("desktop-app/package.json", JSON.stringify(desktopAppPackageJson, null, 2))
    }
  }
}
