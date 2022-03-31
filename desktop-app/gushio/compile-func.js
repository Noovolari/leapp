module.exports = async function compileFunction(path, shellJs, target) {
  const desktopAppModulePath = path.join(__dirname, '..')
  shellJs.cd(desktopAppModulePath)

  let result = shellJs.exec(`ng build --${target} --base-href ./`)
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }

  result = shellJs.exec('tsc --p electron')
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}
