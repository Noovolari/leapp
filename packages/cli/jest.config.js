module.exports = {
  preset: "../../jest.preset.js",
  testTimeout: 10000,
  globalSetup: "<rootDir>/jest.global-setup.js",
  globalTeardown: "<rootDir>/jest.global-teardown.js",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/cli-native-service.ts",
    "!src/**/team-service.ts",
    "!src/**/team-service-stub.ts",
    "!src/**/leapp-team-core/**"
  ],
  coverageReporters: [
    "lcov",
    "json-summary",
    "text",
    "text-summary"
  ]
};

