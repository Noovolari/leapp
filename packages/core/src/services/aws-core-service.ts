import { constants } from "../models/constants";
import { Session } from "../models/session";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LogLevel, LogService } from "./log-service";

// TODO: rename it. This naming is ambiguous.
export class AwsCoreService {
  static stsEndpointsPerRegion: Map<string, string> = new Map([
    ["af-south-1", "https://sts.af-south-1.amazonaws.com"],
    ["ap-east-1", "https://sts.ap-east-1.amazonaws.com"],
    ["ap-northeast-1", "https://sts.ap-northeast-1.amazonaws.com"],
    ["ap-northeast-2", "https://sts.ap-northeast-2.amazonaws.com"],
    ["ap-northeast-3", "https://sts.ap-northeast-3.amazonaws.com"],
    ["ap-south-1", "https://sts.ap-south-1.amazonaws.com"],
    ["ap-southeast-1", "https://sts.ap-southeast-1.amazonaws.com"],
    ["ap-southeast-2", "https://sts.ap-southeast-2.amazonaws.com"],
    ["ap-southeast-3", "https://sts.ap-southeast-3.amazonaws.com"],
    ["ap-southeast-4", "https://sts.ap-southeast-4.amazonaws.com"],
    ["ca-central-1", "https://sts.ca-central-1.amazonaws.com"],
    ["cn-north-1", "https://sts.cn-north-1.amazonaws.com.cn"],
    ["cn-northwest-1", "https://sts.cn-northwest-1.amazonaws.com.cn"],
    ["eu-central-1", "https://sts.eu-central-1.amazonaws.com"],
    ["eu-central-2", "https://sts.eu-central-2.amazonaws.com"],
    ["eu-north-1", "https://sts.eu-north-1.amazonaws.com"],
    ["eu-south-1", "https://sts.eu-south-1.amazonaws.com"],
    ["eu-south-2", "https://sts.eu-south-2.amazonaws.com"],
    ["eu-west-1", "https://sts.eu-west-1.amazonaws.com"],
    ["eu-west-2", "https://sts.eu-west-2.amazonaws.com"],
    ["eu-west-3", "https://sts.eu-west-3.amazonaws.com"],
    ["me-south-1", "https://sts.me-south-1.amazonaws.com"],
    ["sa-east-1", "https://sts.sa-east-1.amazonaws.com"],
    ["us-east-1", "https://sts.us-east-1.amazonaws.com"],
    ["us-east-2", "https://sts.us-east-2.amazonaws.com"],
    ["us-gov-east-1", "https://sts.us-gov-east-1.amazonaws.com"],
    ["us-gov-west-1", "https://sts.us-gov-west-1.amazonaws.com"],
    ["us-west-1", "https://sts.us-west-1.amazonaws.com"],
    ["us-west-2", "https://sts.us-west-2.amazonaws.com"],
  ]);

  constructor(private nativeService: INativeService, private logService: LogService) {}

  awsCredentialPath(): string {
    return this.nativeService.path.join(this.nativeService.os.homedir(), ".aws", "credentials");
  }

  awsBkpCredentialPath(): string {
    return this.nativeService.path.join(this.nativeService.os.homedir(), ".aws", "credentials.bkp");
  }

  awsConfigPath(): string {
    return this.nativeService.path.join(this.nativeService.os.homedir(), ".aws", "config");
  }

  awsBkpConfigPath(): string {
    return this.nativeService.path.join(this.nativeService.os.homedir(), ".aws", "config.bkp");
  }

  stsOptions(session: Session): any {
    let options: any = {
      maxRetries: 0,
      httpOptions: { timeout: constants.timeout },
    };

    if (session.region) {
      options = {
        ...options,
        endpoint: AwsCoreService.stsEndpointsPerRegion.get(session.region),
        region: session.region,
      };
    }

    return options;
  }

  cleanCredentialFile(): void {
    try {
      const awsCredentialsPath = this.awsCredentialPath();
      // Rewrite credential file
      this.nativeService.fs.writeFileSync(awsCredentialsPath, "");
    } catch (error) {
      this.logService.log(
        new LoggedEntry(`Can't delete aws credential file probably missing: ${error.toString()}`, this, LogLevel.warn, false, error.stack)
      );
    }
  }

  getRegions(): { region: string }[] {
    const regionKeys = [...AwsCoreService.stsEndpointsPerRegion.keys()];
    return regionKeys.map((key) => ({ region: key }));
  }
}
