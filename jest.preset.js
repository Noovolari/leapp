module.exports = {
  verbose: true,
  silent: false,
  testMatch: [
    "**/*.spec.ts",
    "!dist/",
    "!node_modules/"
  ],
  // @noovolari/leapp-core/* resolves to dist/ through core's package.json "exports" (Jest 30 reads it)
  moduleNameMapper: {
    "axios": "axios/dist/node/axios.cjs"
  }
}
