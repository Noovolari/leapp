import { RDSDataClient } from "@aws-sdk/client-rds-data";
import {SQSClient} from "@aws-sdk/client-sqs";

export class Service {
	private rdsClient: RDSDataClient | undefined;
  private sqsClient: SQSClient | undefined;
	constructor(public region: string) {}

	get rds(): RDSDataClient {
		if (!this.rdsClient) {
			this.rdsClient = new RDSDataClient({
				region: this.region
			});
		}
		return this.rdsClient;
	}

  get sqs(): SQSClient {
    if (!this.sqsClient) {
      this.sqsClient = new SQSClient({
        region: this.region
      });
    }
    return this.sqsClient;
  }
}
