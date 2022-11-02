module.exports = {
  preset: "../../jest.preset.js",
  testTimeout: 10000,
  collectCoverageFrom: [
    "src/**/{!(cli-native-service),}.ts"
  ],
  coverageReporters: [
    "lcov",
    "json-summary",
    "text",
    "text-summary"
  ]
};

