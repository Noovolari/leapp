module.exports = async function deleteFunction(path, relativePath) {
  let dirPath = path.join(__dirname, relativePath)
  await fs.remove(dirPath)
}
