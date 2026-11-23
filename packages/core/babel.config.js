module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
  // Babel 8: the former loose class-properties / private-property-in-object modes
  assumptions: {
    setPublicClassFields: true,
    privateFieldsAsProperties: true,
  },
  plugins: [
    ["@babel/plugin-proposal-decorators", { "version": "legacy" }],
    // legacy decorators need class fields transformed after them
    "@babel/plugin-transform-class-properties",
  ]
}
