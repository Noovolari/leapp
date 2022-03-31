module.exports = async function bumpVersionFunction(path, semver) {
  const packageJsonFile = path.join(__dirname, '../package.json')
  const packageJson = await fs.readJson(packageJsonFile)
  packageJson.version = semver.inc(packageJson.version, 'patch')
  await fs.writeJson(packageJsonFile, packageJson, {spaces: 2})
}
