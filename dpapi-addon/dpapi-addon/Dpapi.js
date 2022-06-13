/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const bindings = require("bindings");

module.exports = bindings({
  bindings: "dpapi",
  userDefinedTries: [["module_root", "node_modules", "build", "Release", "bindings"]],
});
