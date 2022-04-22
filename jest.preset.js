module.exports = {
  verbose: true,
  testMatch: [
    "**/*.spec.ts",
    "!dist/",
    "!node_modules/"
  ],
  moduleNameMapper: {
    "^@noovolari/leapp-core/(.*)$": "@noovolari/leapp-core/dist/$1"
  }
}
