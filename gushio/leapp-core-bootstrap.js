module.exports = async function leappCoreBootstrap(packageName, coreVersionSelector) {
  const path = await gushio.import('path')
  const shellJs = await gushio.import('shelljs')
  const readPackageJsonFunction = require('./read-package-json-func')
  const writePackageJsonFunction = require('./write-package-json-func')
  const deleteFunction = require('./delete-func')

  const packageToModify = await readPackageJsonFunction(path, packageName)
  const corePackage = await readPackageJsonFunction(path, 'core')
  packageToModify['dependencies']["@noovolari/leapp-core"] = coreVersionSelector(corePackage)
  await writePackageJsonFunction(path, packageName, packageToModify)

  const packageRelativePath = ["..", "packages", packageName];
  const npmOrganization = "@noovolari";
  await deleteFunction(path, ...packageRelativePath, "node_modules", npmOrganization)
  await deleteFunction(path, ...packageRelativePath, "package-lock.json")
  shellJs.cd(path.join(__dirname, ...packageRelativePath))
  let result = shellJs.exec('npm install')
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}
