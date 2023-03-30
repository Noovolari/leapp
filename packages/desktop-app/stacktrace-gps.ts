const sourceMap = require("source-map");
const fs = require("fs");
const fileContent = fs.readFileSync("dist/leapp-client/main.4810f5228b6059d7.js.map");
const rawSourceMap = JSON.parse(fileContent.toString());
//console.log(rawSourceMap);
const consumerPromise = new sourceMap.SourceMapConsumer(rawSourceMap);
consumerPromise
  .then((consumer) => {
    //console.log(consumer);
    const res = consumer.originalPositionFor({
      line: 16346,
      column: 15,
    });
    console.log(res);
    // TODO: check if .js
    const fileContent2 = fs.readFileSync("../core/dist/services/integration/azure-integration-service.js.map");
    const rawSourceMap2 = JSON.parse(fileContent2.toString());
    const consumerPromise2 = new sourceMap.SourceMapConsumer(rawSourceMap2);
    consumerPromise2
      .then((consumer2) => {
        //console.log(consumer);
        const res2 = consumer2.originalPositionFor({
          line: 110,
          column: 18,
        });
        console.log(res2);
        consumer2.destroy();
      })
      .finally(() => {});
    consumer.destroy();
  })
  .finally(() => {});
