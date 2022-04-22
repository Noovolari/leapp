module.exports = async function compileFunction(path, shellJs) {
  shellJs.cd(path.join(__dirname, '..'))
  const result = shellJs.exec('npx tsc')
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}
