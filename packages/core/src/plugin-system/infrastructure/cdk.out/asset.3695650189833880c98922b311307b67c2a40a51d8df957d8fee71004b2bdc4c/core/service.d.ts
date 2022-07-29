import { RDSDataClient } from "@aws-sdk/client-rds-data";
export declare class Service {
    region: string;
    private rdsClient;
    constructor(region: string);
    get rds(): RDSDataClient;
}
