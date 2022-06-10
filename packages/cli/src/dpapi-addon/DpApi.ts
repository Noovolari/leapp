import { IMsalEncryptionService } from "@noovolari/leapp-core/interfaces/i-msal-encryption-service";
import path from "path";

const binding = require("node-gyp-build")(path.join(__dirname, "..")) as IMsalEncryptionService;
export default binding;
