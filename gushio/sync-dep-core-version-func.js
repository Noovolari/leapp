const updateCoreDependencyVersion = async (path, shellJs, coreName, coreVersion, modulePath) => {
  const packageJsonPath = path.join(__dirname, modulePath, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)
  packageJson.dependencies[coreName] = `${coreVersion}`
  await fs.writeJson(packageJsonPath, packageJson, {spaces: 2})

  shellJs.cd(path.join(__dirname, modulePath))
}

module.exports = async function bumpVersionFunction(path, shellJs) {
  const corePackageJsonPath = path.join(__dirname, '../packages/core/package.json')
  const corePackageJson = await fs.readJson(corePackageJsonPath)
  await updateCoreDependencyVersion(path, shellJs, corePackageJson.name, corePackageJson.version, '../packages/desktop-app')
  await updateCoreDependencyVersion(path, shellJs, corePackageJson.name, corePackageJson.version, '../packages/cli')
}