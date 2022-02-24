module.exports = async function compileFunction(shellJs, target) {
    let result = shellJs.exec(`ng build --${target} --base-href ./`)
    if (result.code !== 0) {
        throw new Error(result.stderr)
    }

    result = shellJs.exec('tsc --p electron')
    if (result.code !== 0) {
        throw new Error(result.stderr)
    }
}
