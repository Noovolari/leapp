module.exports = async function copyFunction(path, relativeSourcePath, relativeDestinationPath) {
    const sourcePath = path.join(__dirname, relativeSourcePath)
    const destinationPath = path.join(__dirname, relativeDestinationPath)
    await fs.copy(sourcePath, destinationPath)
}
