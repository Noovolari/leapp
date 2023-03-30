module.exports = {
  cli: {
    name: 'stacktrace-gps',
    description: 'Extract stacktrace source, line, and column from a given SourceMap file path',
    version: '0.1',
    arguments: [
      { name: '<sourcemap-file-path>' },
      { name: '<sourcemap-line>' },
      { name: '<sourcemap-column>' },
    ],
    deps: [
      { name: 'source-map', version: '0.7.4' },
    ],
  },
  run: async (args) => {
    const sourceMapFilePath = args[0];
    const sourceMapLine = parseInt(args[1]);
    const sourceMapColumn = parseInt(args[2]);
    const rootCause = await getRootCause(sourceMapFilePath, sourceMapLine, sourceMapColumn);
    console.log(rootCause);
  },
}

const getRootCause = async (sourceMapFilePath, sourceMapLine, sourceMapColumn) => {
  const fs = require("fs");
  const path = require("path");
  const sourceMap = require("source-map");

  const fileContent = fs.readFileSync(sourceMapFilePath);
  const rawSourceMap = JSON.parse(fileContent.toString());
  //console.log(rawSourceMap);
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
  //console.log(consumer);

  let rootCause = consumer.originalPositionFor({
    line: sourceMapLine,
    column: sourceMapColumn,
  });

  if (rootCause.source.includes(".js")) {
    const isWebpack = rootCause.source.startsWith("webpack://");
    sourceMapFilePath = rootCause.source.replace(/(webpack:\/\/|file:\/\/)/, '');
    if (isWebpack) {
      sourceMapFilePath = path.join(__dirname, "..", sourceMapFilePath);
    }
    return await getRootCause(sourceMapFilePath + ".map", rootCause.line, rootCause.column);
  } else if (rootCause.source.includes(".ts")) {
    return rootCause;
  }
};
