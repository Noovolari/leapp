import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { SQSClient } from "@aws-sdk/client-sqs";
export declare class Service {
    region: string;
    private rdsClient;
    private sqsClient;
    constructor(region: string);
    get rds(): RDSDataClient;
    get sqs(): SQSClient;
}
