"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
var account_1 = require("./account");
var uuid = require("uuid");
var class_transformer_1 = require("class-transformer");
var aws_plain_account_1 = require("./aws-plain-account");
var AccountType_1 = require("./AccountType");
var environment_1 = require("../../environments/environment");
var Session = /** @class */ (function () {
    function Session(account, profileId) {
        var _this = this;
        this.expired = function () {
            if (_this.startDateTime) {
                return false;
            }
            var currentTime = new Date().getTime();
            var startTime = new Date(_this.startDateTime).getTime();
            return (currentTime - startTime) / 1000 > environment_1.environment.sessionDuration;
        };
        this.sessionId = uuid.v4();
        this.profileId = profileId;
        this.startDateTime = undefined;
        this.lastStopDateTime = new Date().toISOString();
        this.active = false;
        this.loading = false;
        this.account = account;
    }
    __decorate([
        class_transformer_1.Type(function () { return account_1.Account; }, {
            discriminator: {
                property: 'type',
                subTypes: [
                    { value: aws_plain_account_1.AwsPlainAccount, name: AccountType_1.AccountType.AWS_PLAIN_USER },
                ],
            },
        }),
        __metadata("design:type", account_1.Account)
    ], Session.prototype, "account", void 0);
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=session.js.map