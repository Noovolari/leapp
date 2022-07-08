import { RDSDataClient } from "@aws-sdk/client-rds-data";

export class Service {
	private rdsClient: RDSDataClient | undefined;
	constructor(public region: string) {}

	get rds(): RDSDataClient {
		if (!this.rdsClient) {
			this.rdsClient = new RDSDataClient({
				region: this.region
			});
		}
		return this.rdsClient;
	}
}
