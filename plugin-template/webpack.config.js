const path = require('path');

module.exports = {
  mode: 'development',
  entry: './web-console-plugin.ts',
  output: {
    path: path.resolve(__dirname),
    filename: 'plugin.js',
    library: {
      type: 'commonjs2',
    },
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
