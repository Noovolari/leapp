import {
	BeginTransactionCommand,
	CommitTransactionCommand,
	CommitTransactionCommandOutput,
	ExecuteStatementCommand,
	ExecuteStatementCommandOutput,
	Field,
	RollbackTransactionCommand,
	RollbackTransactionCommandOutput,
	SqlParameter
} from "@aws-sdk/client-rds-data";
import { ColumnMetadata } from "@aws-sdk/client-rds-data/dist-types/models/models_0";
import { CustomError, DataApiError } from "../core/custom.error";
import { HTTPStatusCodeEnum } from "../enum/http-status-code.enum";
import { Logger } from "../core/logger";
import {Service} from "../core/service";
import {environment} from "../environments/environment";

const formatRecordValue = (
	value: number | string | Date,
	typeName: string,
	formatOptions: { [key: string]: any }
) =>
	formatOptions &&
	formatOptions.deserializeDate &&
	["DATE", "DATETIME", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE"].includes(
		typeName
	)
		? formatFromTimeStamp(
				value,
				(formatOptions && formatOptions.treatAsLocalDate) ||
					typeName === "TIMESTAMP WITH TIME ZONE"
		  )
		: value;

const formatFromTimeStamp = (
	value: number | string | Date,
	treatAsLocalDate: boolean
) =>
	!treatAsLocalDate &&
	/^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2}(\.\d{3})?)?$/.test(value.toString())
		? new Date(value + "Z")
		: new Date(value);

export class DataApiConnector extends Service {
	private readonly rdsArn: string;
	private readonly secretArn: string;
	private readonly databaseName: string;
	private readonly schema: string;

	constructor() {
		super(environment.REGION);

		this.rdsArn = environment.RDS_ARN;
		this.secretArn = environment.RDS_SECRET_ARN;
		this.databaseName = environment.RDS_DATABASE;
		this.schema = "public";
	}

	public async beginTransaction(): Promise<string> {
		const beginTransaction = new BeginTransactionCommand({
			database: this.databaseName,
			resourceArn: this.rdsArn,
			schema: this.schema,
			secretArn: this.secretArn
		});

		return this.rds.send(beginTransaction).then((res) => {
			if (res.transactionId) {
				return res.transactionId;
			} else {
				throw new CustomError(
					HTTPStatusCodeEnum.internalServerError,
					"Could not begin transaction"
				);
			}
		});
	}

	public async rollbackTransaction(
		transactionId: string
	): Promise<RollbackTransactionCommandOutput | void> {
		const rollbackTransaction = new RollbackTransactionCommand({
			resourceArn: this.rdsArn,
			transactionId: transactionId,
			secretArn: this.secretArn
		});

		return this.rds.send(rollbackTransaction);
	}

	public async commitTransaction(
		transactionId: string
	): Promise<CommitTransactionCommandOutput | void> {
		const commitTransaction = new CommitTransactionCommand({
			resourceArn: this.rdsArn,
			transactionId: transactionId,
			secretArn: this.secretArn
		});

		return this.rds.send(commitTransaction);
	}

	public async executeStatement(
		sql: string,
		parameters: { [key: string]: any },
		transactionId?: string
	) {
		Logger.debug("SQL:", sql);
		Logger.debug("Parameters:", parameters);

		const executionStatement = new ExecuteStatementCommand({
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
			Logger.debug("Execute statement command sent");
			const response: ExecuteStatementCommandOutput = await this.rds.send(
				executionStatement
			);
			Logger.debug("Execute statement response received");

			const responseParsed = this.generateResponse(response);

			Logger.debug("Query results:", responseParsed.records);

			return responseParsed;
		} catch (err: any) {
			Logger.error(err);
			if (err && err.name === "BadRequestException") {
				throw new DataApiError(err.message);
			} else {
				throw err;
			}
		}
	}

	/**
	 *  Convert the passed parameter into the dict object used by the AWS SDK client.
	 */
	private convertValue(value: any): Field {
		if (typeof value === "boolean") {
			return { booleanValue: value };
		}

		if (typeof value === "string") {
			return { stringValue: value };
		}

		if (
			typeof value === "number" &&
			parseInt(value.toString(), 10) === value
		) {
			return { longValue: value };
		}
		if (
			typeof value === "number" &&
			parseFloat(value.toString()) === value
		) {
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
	private createSqlParameters(input: { [key: string]: any }): any[] {
		const parameter: SqlParameter[] = [];
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
	private generateResponse(dataApiResponse: ExecuteStatementCommandOutput): {
		records: any[];
		numberOfRecordsUpdated: number | undefined;
		generatedFields: any[] | undefined;
	} {
		if (dataApiResponse.records && dataApiResponse.columnMetadata) {
			return {
				records: this.formatRecords(
					dataApiResponse.records,
					dataApiResponse.columnMetadata,
					true,
					{}
				),
				numberOfRecordsUpdated: dataApiResponse.numberOfRecordsUpdated,
				generatedFields: dataApiResponse.generatedFields
			};
		} else {
			return {
				records: [],
				numberOfRecordsUpdated: dataApiResponse.numberOfRecordsUpdated,
				generatedFields: dataApiResponse.generatedFields
			};
		}
	}

	private formatRecords(
		recs: Field[][],
		columns: ColumnMetadata[],
		hydrate: boolean,
		formatOptions: any
	) {
		if (!recs || recs.length === 0) return [];
		// Create map for efficient value parsing
		const fmap: any = recs[0].map((_, i) => ({
			label: columns[i].label,
			typeName: columns[i].typeName,
			type: columns[i].type
		}));

		// Map over all the records (rows)
		return recs.map((rec: Field[]) => {
			// Reduce each field in the record (row)
			return rec.reduce(
				(acc, field: { [key: string]: any }, i) => {
					// If the field is null, always return null
					if (field.isNull === true) {
						return hydrate // object if hydrate, else array
							? {
									...acc,
									...{ [fmap[i].label ?? "label"]: null }
							  }
							: JSON.parse(JSON.stringify(acc));

						// If the field is mapped, return the mapped field
					} else if (fmap[i] && fmap[i].field) {
						const value = formatRecordValue(
							field[fmap[i].field],
							fmap[i].typeName,
							formatOptions
						);
						return hydrate // object if hydrate, else array
							? Object.assign(acc, { [fmap[i].label]: value })
							: Object.assign(acc, value);

						// Else discover the field type
					} else {
						// Look for non-null fields
						Object.keys(field).map((type) => {
							if (type !== "isNull" && field[type] !== null) {
								fmap[i]["field"] = type;
							}
						});

						// Return the mapped field (this should NEVER be null)
						const value = formatRecordValue(
							field[fmap[i].field],
							fmap[i].typeName,
							formatOptions
						);
						return hydrate // object if hydrate, else array
							? Object.assign(acc, { [fmap[i].label]: value })
							: Object.assign(acc, value);
					}
				},
				hydrate ? {} : []
			); // init object if hydrate, else init array
		}); // empty record set returns an array
	} // end formatRecords
}
