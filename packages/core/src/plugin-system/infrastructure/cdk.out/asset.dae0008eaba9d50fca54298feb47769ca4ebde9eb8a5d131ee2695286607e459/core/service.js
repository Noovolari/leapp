"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const client_rds_data_1 = require("@aws-sdk/client-rds-data");
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
}
exports.Service = Service;
//# sourceMappingURL=service.js.map