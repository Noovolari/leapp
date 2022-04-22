module.exports = async function checkNpmCoreVersion(path, shellJs) {
  const cliPackageJsonFile = path.join(__dirname, '../package.json')
  const cliPackageJson = await fs.readJson(cliPackageJsonFile)

  const corePackageJsonFile = path.join(__dirname, '../../core/package.json')
  const corePackageJson = await fs.readJson(corePackageJsonFile)
  const corePackageName = corePackageJson.name

  const result = shellJs.exec(`npm show ${corePackageName} version`)
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
  const currentCoreNpmVersion = result.stdout.trim()

  let requiredCoreVersion = cliPackageJson.dependencies[corePackageName];
  if (!requiredCoreVersion.includes(currentCoreNpmVersion)) {
    throw new Error(`${corePackageName} required version ${requiredCoreVersion} doesn't match the current version on npm ${currentCoreNpmVersion}`)
  }
}
