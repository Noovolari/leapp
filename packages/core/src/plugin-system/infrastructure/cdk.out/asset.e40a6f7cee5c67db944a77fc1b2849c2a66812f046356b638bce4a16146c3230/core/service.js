"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const client_rds_data_1 = require("@aws-sdk/client-rds-data");
const client_sqs_1 = require("@aws-sdk/client-sqs");
class Service {
    constructor(region) {
        this.region = region;
    }
    get rds() {
        if (!this.rdsClient) {
            this.rdsClient = new client_rds_data_1.RDSDataClient({
                region: this.region
            });
        }
        return this.rdsClient;
    }
    get sqs() {
        if (!this.sqsClient) {
            this.sqsClient = new client_sqs_1.SQSClient({
                region: this.region
            });
        }
        return this.sqsClient;
    }
}
exports.Service = Service;
//# sourceMappingURL=service.js.map