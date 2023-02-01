module.exports = async function deleteFunction(path, ...relativePath) {
  const dirPath = path.join(__dirname, ...relativePath)
  await fs.remove(dirPath)
}
