module.exports = async function writePackageJsonFunction(path, packageName, packageJson) {
  await fs.writeFile(path.join(__dirname, '..', 'packages', packageName, 'package.json'),
    JSON.stringify(packageJson, undefined, 2))
}
