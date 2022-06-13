module.exports = async function readPackageJsonFunction(path, packageName) {
  const packageFile = await fs.readFile(path.join(__dirname, '..', 'packages', packageName, 'package.json'))
  return JSON.parse(packageFile)
}
