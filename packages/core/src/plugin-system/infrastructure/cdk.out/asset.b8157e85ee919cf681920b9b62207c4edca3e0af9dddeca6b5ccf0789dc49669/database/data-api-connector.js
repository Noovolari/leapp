"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataApiConnector = void 0;
const client_rds_data_1 = require("@aws-sdk/client-rds-data");
const custom_error_1 = require("../core/custom.error");
const http_status_code_enum_1 = require("../enum/http-status-code.enum");
const logger_1 = require("../core/logger");
const service_1 = require("../core/service");
const environment_1 = require("../environments/environment");
const formatRecordValue = (value, typeName, formatOptions) => formatOptions &&
    formatOptions.deserializeDate &&
    ["DATE", "DATETIME", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE"].includes(typeName)
    ? formatFromTimeStamp(value, (formatOptions && formatOptions.treatAsLocalDate) ||
        typeName === "TIMESTAMP WITH TIME ZONE")
    : value;
const formatFromTimeStamp = (value, treatAsLocalDate) => !treatAsLocalDate &&
    /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2}(\.\d{3})?)?$/.test(value.toString())
    ? new Date(value + "Z")
    : new Date(value);
class DataApiConnector extends service_1.Service {
    constructor() {
        super(environment_1.environment.REGION);
        this.rdsArn = environment_1.environment.RDS_ARN;
        this.secretArn = environment_1.environment.RDS_SECRET_ARN;
        this.databaseName = environment_1.environment.RDS_DATABASE;
        this.schema = "public";
    }
    async beginTransaction() {
        const beginTransaction = new client_rds_data_1.BeginTransactionCommand({
            database: this.databaseName,
            resourceArn: this.rdsArn,
            schema: this.schema,
            secretArn: this.secretArn
        });
        return this.rds.send(beginTransaction).then((res) => {
            if (res.transactionId) {
                return res.transactionId;
            }
            else {
                throw new custom_error_1.CustomError(http_status_code_enum_1.HTTPStatusCodeEnum.internalServerError, "Could not begin transaction");
            }
        });
    }
    async rollbackTransaction(transactionId) {
        const rollbackTransaction = new client_rds_data_1.RollbackTransactionCommand({
            resourceArn: this.rdsArn,
            transactionId: transactionId,
            secretArn: this.secretArn
        });
        return this.rds.send(rollbackTransaction);
    }
    async commitTransaction(transactionId) {
        const commitTransaction = new client_rds_data_1.CommitTransactionCommand({
            resourceArn: this.rdsArn,
            transactionId: transactionId,
            secretArn: this.secretArn
        });
        return this.rds.send(commitTransaction);
    }
    async executeStatement(sql, parameters, transactionId) {
        logger_1.Logger.debug("SQL:", sql);
        logger_1.Logger.debug("Parameters:", parameters);
        const executionStatement = new client_rds_data_1.ExecuteStatementCommand({
            resourceArn: this.rdsArn,
            secretArn: this.secretArn,
            database: this.databaseName,
            schema: this.schema,
            transactionId: transactionId,
            continueAfterTimeout: false,
            includeResultMetadata: true,
            parameters: this.createSqlParameters(parameters),
            resultSetOptions: undefined,
            sql
        });
        try {
            logger_1.Logger.debug("Execute statement command sent");
            const response = await this.rds.send(executionStatement);
            logger_1.Logger.debug("Execute statement response received");
            const responseParsed = this.generateResponse(response);
            logger_1.Logger.debug("Query results:", responseParsed.records);
            return responseParsed;
        }
        catch (err) {
            logger_1.Logger.error(err);
            if (err && err.name === "BadRequestException") {
                throw new custom_error_1.DataApiError(err.message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     *  Convert the passed parameter into the dict object used by the AWS SDK client.
     */
    convertValue(value) {
        if (typeof value === "boolean") {
            return { booleanValue: value };
        }
        if (typeof value === "string") {
            return { stringValue: value };
        }
        if (typeof value === "number" &&
            parseInt(value.toString(), 10) === value) {
            return { longValue: value };
        }
        if (typeof value === "number" &&
            parseFloat(value.toString()) === value) {
            return { doubleValue: value };
        }
        if (value instanceof Date) {
            return { stringValue: value.toISOString() };
        }
        if (Buffer.isBuffer(value)) {
            return { blobValue: value };
        }
        if (value instanceof Boolean) {
            // return {'arrayValue': this.convert_array_value(value)}
        }
        if (value === undefined || value === null) {
            return { isNull: true };
        }
        throw new Error("unsupported type " + JSON.stringify(value));
    }
    /**
     * Convert all the passed parameter into the dict object used by the AWS SDK client
     */
    createSqlParameters(input) {
        const parameter = [];
        Object.keys(input).forEach((key) => {
            parameter.push({
                name: key,
                value: this.convertValue(input[key])
            });
        });
        return parameter;
    }
    /**
     * Convert the DataAPI client response into the correct response.
     * @param dataApiResponse
     */
    generateResponse(dataApiResponse) {
        if (dataApiResponse.records && dataApiResponse.columnMetadata) {
            return {
                records: this.formatRecords(dataApiResponse.records, dataApiResponse.columnMetadata, true, {}),
                numberOfRecordsUpdated: dataApiResponse.numberOfRecordsUpdated,
                generatedFields: dataApiResponse.generatedFields
            };
        }
        else {
            return {
                records: [],
                numberOfRecordsUpdated: dataApiResponse.numberOfRecordsUpdated,
                generatedFields: dataApiResponse.generatedFields
            };
        }
    }
    formatRecords(recs, columns, hydrate, formatOptions) {
        if (!recs || recs.length === 0)
            return [];
        // Create map for efficient value parsing
        const fmap = recs[0].map((_, i) => ({
            label: columns[i].label,
            typeName: columns[i].typeName,
            type: columns[i].type
        }));
        // Map over all the records (rows)
        return recs.map((rec) => {
            // Reduce each field in the record (row)
            return rec.reduce((acc, field, i) => {
                var _a;
                // If the field is null, always return null
                if (field.isNull === true) {
                    return hydrate // object if hydrate, else array
                        ? {
                            ...acc,
                            ...{ [(_a = fmap[i].label) !== null && _a !== void 0 ? _a : "label"]: null }
                        }
                        : JSON.parse(JSON.stringify(acc));
                    // If the field is mapped, return the mapped field
                }
                else if (fmap[i] && fmap[i].field) {
                    const value = formatRecordValue(field[fmap[i].field], fmap[i].typeName, formatOptions);
                    return hydrate // object if hydrate, else array
                        ? Object.assign(acc, { [fmap[i].label]: value })
                        : Object.assign(acc, value);
                    // Else discover the field type
                }
                else {
                    // Look for non-null fields
                    Object.keys(field).map((type) => {
                        if (type !== "isNull" && field[type] !== null) {
                            fmap[i]["field"] = type;
                        }
                    });
                    // Return the mapped field (this should NEVER be null)
                    const value = formatRecordValue(field[fmap[i].field], fmap[i].typeName, formatOptions);
                    return hydrate // object if hydrate, else array
                        ? Object.assign(acc, { [fmap[i].label]: value })
                        : Object.assign(acc, value);
                }
            }, hydrate ? {} : []); // init object if hydrate, else init array
        }); // empty record set returns an array
    } // end formatRecords
}
exports.DataApiConnector = DataApiConnector;
//# sourceMappingURL=data-api-connector.js.map