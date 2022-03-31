const updateCoreDependencyVersion = async (path, shellJs, coreName, coreVersion, modulePath) => {
  const packageJsonPath = path.join(__dirname, modulePath, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)
  packageJson.dependencies[coreName] = `${coreVersion}`
  await fs.writeJson(packageJsonPath, packageJson, {spaces: 2})

  shellJs.cd(path.join(__dirname, modulePath))
  let result = shellJs.exec('npm cache clean --force')
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }

  result = shellJs.exec('npm install')
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}

module.exports = async function bumpVersionFunction(path, shellJs) {
  const corePackageJsonPath = path.join(__dirname, '../core/package.json')
  const corePackageJson = await fs.readJson(corePackageJsonPath)
  await updateCoreDependencyVersion(path, shellJs, corePackageJson.name, corePackageJson.version, '../desktop-app')
  await updateCoreDependencyVersion(path, shellJs, corePackageJson.name, corePackageJson.version, '../cli')
}