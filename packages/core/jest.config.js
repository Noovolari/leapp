module.exports = {
  preset: "../../jest.preset.js",
  testMatch: [
    "**/*.spec.ts",
    "**/**/*.spec.ts",
    "log-service.spec.ts"
  ],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/dist/**"
  ],
  coverageReporters: [
    "lcov",
    "json-summary",
    "text",
    "text-summary"
  ]
};
