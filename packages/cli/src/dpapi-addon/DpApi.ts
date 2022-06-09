/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IMsalEncryptionService } from "@noovolari/leapp-core/interfaces/i-msal-encryption-service";

const bindings = require("bindings");

export const dpApi: IMsalEncryptionService = bindings({
  bindings: "dpapi",
  userDefinedTries: [["module_root", "node_modules", "@azure", "msal-node-extensions", "build", "Release", "bindings"]],
});

export default dpApi;
