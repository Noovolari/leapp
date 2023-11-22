module.exports = {
  verbose: true,
  silent: false,
  testMatch: [
    "**/*.spec.ts",
    "!dist/",
    "!node_modules/"
  ],
  moduleNameMapper: {
    "^@noovolari/leapp-core/(.*)$": "@noovolari/leapp-core/dist/$1",
    "axios": "axios/dist/node/axios.cjs"
  }
}
