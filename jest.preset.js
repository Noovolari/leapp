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
    //TODO remove this
    "^@hesketh-racing/leapp-core/(.*)$": "@hesketh-racing/leapp-core/dist/$1"
  }
}
