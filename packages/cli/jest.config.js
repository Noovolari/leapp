module.exports = {
  preset: "../../jest.preset.js",
  testTimeout: 10000,
  collectCoverageFrom: [
    "src/**/{!(cli-native-service),}.ts"
  ]
};

