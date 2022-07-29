"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataApiError = exports.CustomError = void 0;
const http_status_code_enum_1 = require("../enum/http-status-code.enum");
class CustomError extends Error {
    constructor(status, message, cause = "Client Error") {
        super(message);
        this.status = status;
        this.cause = cause;
    }
}
exports.CustomError = CustomError;
class DataApiError extends CustomError {
    constructor(message) {
        super(http_status_code_enum_1.HTTPStatusCodeEnum.internalServerError, message, "Data API error");
    }
}
exports.DataApiError = DataApiError;
//# sourceMappingURL=custom.error.js.map