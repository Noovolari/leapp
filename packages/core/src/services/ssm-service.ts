import { ExecuteService } from "./execute-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "./log-service";
import { constants } from "../models/constants";
import { INativeService } from "../interfaces/i-native-service";
import { FileService } from "./file-service";

export class SsmService {
  aws;
  ssmClient;
  ec2Client;

  constructor(
    private logService: LogService,
    private executeService: ExecuteService,
    private nativeService: INativeService,
    private fileService: FileService
  ) {
    this.aws = require("aws-sdk");
  }

  /**
   * Set the config for the SSM client
   *
   * @param data - the credential information
   * @param region - the region for the client
   */
  static setConfig(data: CredentialsInfo, region: string): any {
    return {
      region,
      accessKeyId: data.sessionToken.aws_access_key_id,
      secretAccessKey: data.sessionToken.aws_secret_access_key,
      sessionToken: data.sessionToken.aws_session_token,
    };
  }

  /**
   * Prepare the two clients and returns the available
   * ssm instances for the selected region
   *
   * @param credentials - pass the credentials object
   * @param region - pass the region where you want to make the request
   * @returns - {Observable<SsmResult>} - return the list of instances capable of SSM in the selected region
   */
  async getSsmInstances(credentials: CredentialsInfo, region: string, setFilteringForEc2CallsCallback?: any): Promise<any> {
    // Set your SSM client and EC2 client
    this.aws.config.update(SsmService.setConfig(credentials, region));
    this.ssmClient = new this.aws.SSM();
    this.ec2Client = new this.aws.EC2();

    // Fix for Ec2 clients from electron app
    // TODO: find a way to inject the origin header without using setFilteringForEc2Calls
    if (setFilteringForEc2CallsCallback) {
      setFilteringForEc2CallsCallback();
    }

    // Get Ssm instances info data
    const instances = await this.requestSsmInstances();
    return await this.applyEc2MetadataInformation(instances);
  }

  /**
   * Start a new ssm session given the instance id
   *
   * @param credentials - CredentialsInfo data from generate credentials method
   * @param instanceId - the instance id of the instance to start
   * @param region - aws System Manager start a session from a defined region
   * @param macOsTerminalType - optional to override terminal type selection on macOS
   */
  startSession(credentials: CredentialsInfo, instanceId: string, region: string, macOsTerminalType?: string): void {
    const quote = this.executeService.getQuote();
    const env = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_ACCESS_KEY_ID: credentials.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SECRET_ACCESS_KEY: credentials.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AWS_SESSION_TOKEN: credentials.sessionToken.aws_session_token,
    };

    if (this.nativeService.process.platform === "darwin") {
      // Creates the ssm-set-env file for the openTerminal
      const exportedEnvVars = `export AWS_SESSION_TOKEN=${env.AWS_SESSION_TOKEN} &&
          export AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} &&
          export AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID}`;
      this.fileService.writeFileSync(this.nativeService.os.homedir() + "/" + constants.ssmSourceFileDestination, exportedEnvVars);
    }

    this.executeService
      .openTerminal(`aws ssm start-session --region ${region} --target ${quote}${instanceId}${quote}`, env, macOsTerminalType)
      .then(() => {
        if (this.nativeService.process.platform === "darwin")
          this.nativeService.rimraf(this.nativeService.os.homedir() + "/" + constants.ssmSourceFileDestination, {}, () => {});
      })
      .catch((err) => {
        if (this.nativeService.process.platform === "darwin")
          this.nativeService.rimraf(this.nativeService.os.homedir() + "/" + constants.ssmSourceFileDestination, {}, () => {});
        throw new LoggedException(err.message, this, LogLevel.error);
      });
  }

  /**
   * Submit the request to do ssm to aws
   */
  private async requestSsmInstances(): Promise<any> {
    let instances = [];

    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention,max-len
      const describeInstanceInformationResponse = await this.ssmClient.describeInstanceInformation({ MaxResults: 50 }).promise();

      // Once we have obtained data from SSM and EC2, we verify the list are not empty
      // eslint-disable-next-line max-len
      if (
        describeInstanceInformationResponse["InstanceInformationList"] &&
        describeInstanceInformationResponse["InstanceInformationList"].length > 0
      ) {
        // Filter only the instances that are currently online
        // eslint-disable-next-line max-len
        instances = describeInstanceInformationResponse["InstanceInformationList"].filter((i) => i.PingStatus === "Online");
        if (instances.length > 0) {
          // For every instance that fulfill we obtain...
          instances.forEach((instance) => {
            // Add name if exists
            instance["ComputerName"] = instance.InstanceId;
            instance["Name"] = instance["ComputerName"];
          });

          // We have found and managed a list of instances
          this.logService.log(new LoggedEntry("Obtained smm info from aws for SSM", this, LogLevel.info));
          return instances;
        } else {
          // No instances usable
          throw new Error("No instances are accessible by this Role.");
        }
      } else {
        // No instances usable
        throw new Error("No instances are accessible by this Role.");
      }
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }

  private async applyEc2MetadataInformation(instances: any): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const params = { MaxResults: 50 };
      const reservations = await this.ec2Client.describeInstances(params).promise();

      instances.forEach((instance) => {
        const foundInstance = reservations.Reservations.filter((r) => r.Instances[0].InstanceId === instance.Name);
        if (foundInstance.length > 0) {
          const foundName = foundInstance[0].Instances[0].Tags.filter((t) => t.Key === "Name");
          if (foundName.length > 0) {
            instance.Name = foundName[0].Value;
          }
        }
      });

      return instances;
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }
}
