module.exports = async function makeDirFunction(path, relativeDirPath) {
    const dirPath = path.join(__dirname, relativeDirPath)
    await fs.mkdirp(dirPath)
}
