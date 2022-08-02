/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../packages/core/dist/plugin-system/plugin-environment.js":
/*!*****************************************************************!*\
  !*** ../packages/core/dist/plugin-system/plugin-environment.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.PluginEnvironment = exports.EnvironmentType = void 0;\nvar EnvironmentType;\n(function (EnvironmentType) {\n    EnvironmentType[\"desktopApp\"] = \"desktop-app\";\n    EnvironmentType[\"cli\"] = \"cli\";\n})(EnvironmentType = exports.EnvironmentType || (exports.EnvironmentType = {}));\nclass PluginEnvironment {\n    constructor(environmentType, providerService) {\n        this.environmentType = environmentType;\n        this.providerService = providerService;\n    }\n}\nexports.PluginEnvironment = PluginEnvironment;\n//# sourceMappingURL=plugin-environment.js.map\n\n//# sourceURL=webpack://leapp-web-console-plugin/../packages/core/dist/plugin-system/plugin-environment.js?");

/***/ }),

/***/ "../packages/core/dist/services/log-service.js":
/*!*****************************************************!*\
  !*** ../packages/core/dist/services/log-service.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.LogService = exports.LoggedException = exports.LoggedEntry = exports.LogLevel = void 0;\n/* istanbul ignore next */\nvar LogLevel;\n(function (LogLevel) {\n    LogLevel[LogLevel[\"success\"] = 0] = \"success\";\n    LogLevel[LogLevel[\"info\"] = 1] = \"info\";\n    LogLevel[LogLevel[\"warn\"] = 2] = \"warn\";\n    LogLevel[LogLevel[\"error\"] = 3] = \"error\";\n})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));\nclass LoggedEntry extends Error {\n    constructor(message, context, level, display = false, customStack) {\n        super(message);\n        this.context = context;\n        this.level = level;\n        this.display = display;\n        this.customStack = customStack;\n    }\n}\nexports.LoggedEntry = LoggedEntry;\nclass LoggedException extends LoggedEntry {\n    constructor(message, context, level, display = true, customStack) {\n        super(message, context, level, display, customStack);\n        this.context = context;\n        this.level = level;\n        this.display = display;\n        this.customStack = customStack;\n    }\n}\nexports.LoggedException = LoggedException;\nclass LogService {\n    constructor(logger) {\n        this.logger = logger;\n    }\n    log(loggedEntry) {\n        var _a;\n        const contextPart = loggedEntry.context ? [`[${loggedEntry.context.constructor[\"name\"]}]`] : [];\n        if (loggedEntry.level === LogLevel.error)\n            this.logger.log([...contextPart, (_a = loggedEntry.customStack) !== null && _a !== void 0 ? _a : loggedEntry.stack].join(\" \"), loggedEntry.level);\n        else\n            this.logger.log(loggedEntry.message, loggedEntry.level);\n        if (loggedEntry.display) {\n            this.logger.show(loggedEntry.message, loggedEntry.level);\n        }\n    }\n}\nexports.LogService = LogService;\n//# sourceMappingURL=log-service.js.map\n\n//# sourceURL=webpack://leapp-web-console-plugin/../packages/core/dist/services/log-service.js?");

/***/ }),

/***/ "./web-console-plugin.ts":
/*!*******************************!*\
  !*** ./web-console-plugin.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"WebConsolePlugin\": () => (/* binding */ WebConsolePlugin)\n/* harmony export */ });\n/* harmony import */ var _noovolari_leapp_core_services_log_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @noovolari/leapp-core/services/log-service */ \"../packages/core/dist/services/log-service.js\");\n/* harmony import */ var _noovolari_leapp_core_plugin_system_plugin_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @noovolari/leapp-core/plugin-system/plugin-environment */ \"../packages/core/dist/plugin-system/plugin-environment.js\");\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nvar __generator = (undefined && undefined.__generator) || function (thisArg, body) {\n    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;\n    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;\n    function verb(n) { return function (v) { return step([n, v]); }; }\n    function step(op) {\n        if (f) throw new TypeError(\"Generator is already executing.\");\n        while (_) try {\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\n            if (y = 0, t) op = [op[0] & 2, t.value];\n            switch (op[0]) {\n                case 0: case 1: t = op; break;\n                case 4: _.label++; return { value: op[1], done: false };\n                case 5: _.label++; y = op[1]; op = [0]; continue;\n                case 7: op = _.ops.pop(); _.trys.pop(); continue;\n                default:\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }\n                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }\n                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }\n                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }\n                    if (t[2]) _.ops.pop();\n                    _.trys.pop(); continue;\n            }\n            op = body.call(thisArg, _);\n        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }\n        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };\n    }\n};\n\n\nvar WebConsolePlugin = /** @class */ (function () {\n    function WebConsolePlugin() {\n    }\n    WebConsolePlugin.prototype.bootstrap = function (pluginEnvironment) {\n        return __awaiter(this, void 0, void 0, function () {\n            var providerService;\n            return __generator(this, function (_a) {\n                providerService = pluginEnvironment.providerService;\n                this.logService = providerService.logService;\n                this.sessionFactory = providerService.sessionFactory;\n                if (pluginEnvironment.environmentType === _noovolari_leapp_core_plugin_system_plugin_environment__WEBPACK_IMPORTED_MODULE_1__.EnvironmentType.desktopApp) {\n                    this.fetch = providerService.appNativeService.fetch;\n                    this.openExternalUrlService = providerService.windowService;\n                }\n                else {\n                    this.fetch = providerService.cliNativeService.fetch;\n                    this.openExternalUrlService = providerService.cliOpenWebConsoleService;\n                }\n                return [2 /*return*/];\n            });\n        });\n    };\n    WebConsolePlugin.prototype.applySessionAction = function (session) {\n        return __awaiter(this, void 0, void 0, function () {\n            var sessionRegion, credentialsInfo, sessionDuration, isUSGovCloud, federationUrl, consoleHomeURL, sessionStringJSON, queryParametersSigninToken, res, response, loginURL;\n            return __generator(this, function (_a) {\n                switch (_a.label) {\n                    case 0:\n                        this.logService.log(new _noovolari_leapp_core_services_log_service__WEBPACK_IMPORTED_MODULE_0__.LoggedEntry(\"Opening web console for session: \" + session.sessionName, this, _noovolari_leapp_core_services_log_service__WEBPACK_IMPORTED_MODULE_0__.LogLevel.info, true));\n                        sessionRegion = session.region;\n                        return [4 /*yield*/, this.sessionFactory.getSessionService(session.type).generateCredentials(session.sessionId)];\n                    case 1:\n                        credentialsInfo = _a.sent();\n                        sessionDuration = 3200;\n                        isUSGovCloud = sessionRegion.startsWith(\"us-gov-\");\n                        if (!isUSGovCloud) {\n                            federationUrl = \"https://signin.aws.amazon.com/federation\";\n                            consoleHomeURL = \"https://\".concat(sessionRegion, \".console.aws.amazon.com/console/home?region=\").concat(sessionRegion);\n                        }\n                        else {\n                            federationUrl = \"https://signin.amazonaws-us-gov.com/federation\";\n                            consoleHomeURL = \"https://console.amazonaws-us-gov.com/console/home?region=\".concat(sessionRegion);\n                        }\n                        if (sessionRegion.startsWith(\"cn-\")) {\n                            throw new Error(\"Unsupported Region\");\n                        }\n                        this.logService.log(new _noovolari_leapp_core_services_log_service__WEBPACK_IMPORTED_MODULE_0__.LoggedEntry(\"Starting opening Web Console\", this, _noovolari_leapp_core_services_log_service__WEBPACK_IMPORTED_MODULE_0__.LogLevel.info));\n                        sessionStringJSON = {\n                            sessionId: credentialsInfo.sessionToken.aws_access_key_id,\n                            sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,\n                            sessionToken: credentialsInfo.sessionToken.aws_session_token,\n                        };\n                        queryParametersSigninToken = \"?Action=getSigninToken&SessionDuration=\".concat(sessionDuration, \"&Session=\").concat(encodeURIComponent(JSON.stringify(sessionStringJSON)));\n                        return [4 /*yield*/, this.fetch(\"\".concat(federationUrl).concat(queryParametersSigninToken))];\n                    case 2:\n                        res = _a.sent();\n                        return [4 /*yield*/, res.json()];\n                    case 3:\n                        response = _a.sent();\n                        loginURL = \"\".concat(federationUrl, \"?Action=login&Issuer=Leapp&Destination=\").concat(consoleHomeURL, \"&SigninToken=\").concat(response.SigninToken);\n                        this.openExternalUrlService.openExternalUrl(loginURL);\n                        return [2 /*return*/];\n                }\n            });\n        });\n    };\n    return WebConsolePlugin;\n}());\n\n\n\n//# sourceURL=webpack://leapp-web-console-plugin/./web-console-plugin.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./web-console-plugin.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;