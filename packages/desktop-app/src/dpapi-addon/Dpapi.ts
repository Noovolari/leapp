/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IMsalEncryptionService } from "@noovolari/leapp-core/interfaces/i-msal-encryption-service";

export const dpApi: IMsalEncryptionService = require("bindings")({
  bindings: "dpapi",
  userDefinedTries: [["module_root", "node_modules", "@azure", "msal-node-extensions", "build", "Release", "bindings"]],
});

export default dpApi;
