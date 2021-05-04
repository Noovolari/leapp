"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsPlainAccount = void 0;
var AccountType_1 = require("./AccountType");
var account_1 = require("./account");
var AwsPlainAccount = /** @class */ (function (_super) {
    __extends(AwsPlainAccount, _super);
    function AwsPlainAccount(accountName, region, mfaDevice) {
        var _this = _super.call(this, accountName, region) || this;
        _this.mfaDevice = mfaDevice;
        _this.type = AccountType_1.AccountType.AWS_PLAIN_USER;
        return _this;
    }
    return AwsPlainAccount;
}(account_1.Account));
exports.AwsPlainAccount = AwsPlainAccount;
//# sourceMappingURL=aws-plain-account.js.map