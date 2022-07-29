import { CommitTransactionCommandOutput, RollbackTransactionCommandOutput } from "@aws-sdk/client-rds-data";
import { Service } from "../core/service";
export declare class DataApiConnector extends Service {
    private readonly rdsArn;
    private readonly secretArn;
    private readonly databaseName;
    private readonly schema;
    constructor();
    beginTransaction(): Promise<string>;
    rollbackTransaction(transactionId: string): Promise<RollbackTransactionCommandOutput | void>;
    commitTransaction(transactionId: string): Promise<CommitTransactionCommandOutput | void>;
    executeStatement(sql: string, parameters: {
        [key: string]: any;
    }, transactionId?: string): Promise<{
        records: any[];
        numberOfRecordsUpdated: number;
        generatedFields: any[];
    }>;
    /**
     *  Convert the passed parameter into the dict object used by the AWS SDK client.
     */
    private convertValue;
    /**
     * Convert all the passed parameter into the dict object used by the AWS SDK client
     */
    private createSqlParameters;
    /**
     * Convert the DataAPI client response into the correct response.
     * @param dataApiResponse
     */
    private generateResponse;
    private formatRecords;
}
