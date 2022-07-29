"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPStatusCodeEnum = void 0;
var HTTPStatusCodeEnum;
(function (HTTPStatusCodeEnum) {
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["oK"] = 200] = "oK";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["created"] = 201] = "created";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["badRequest"] = 400] = "badRequest";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["unauthorized"] = 401] = "unauthorized";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["forbidden"] = 403] = "forbidden";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["notFound"] = 404] = "notFound";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["unprocessable"] = 422] = "unprocessable";
    HTTPStatusCodeEnum[HTTPStatusCodeEnum["internalServerError"] = 500] = "internalServerError";
})(HTTPStatusCodeEnum = exports.HTTPStatusCodeEnum || (exports.HTTPStatusCodeEnum = {}));
//# sourceMappingURL=http-status-code.enum.js.map