import { ExecuteService } from "./execute-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "./log-service";
import { constants } from "../models/constants";
import { INativeService } from "../interfaces/i-native-service";
import { FileService } from "./file-service";
import { DescribeInstanceInformationCommand, SSMClient } from "@aws-sdk/client-ssm";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";

export class SsmService {
  ssmClient: SSMClient;
  ec2Client: EC2Client;

  constructor(
    private logService: LogService,
    private executeService: ExecuteService,
    private nativeService: INativeService,
    private fileService: FileService
  ) {}

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
    this.ssmClient = new SSMClient({
      region,
      credentials: {
        accessKeyId: credentials.sessionToken.aws_access_key_id,
        secretAccessKey: credentials.sessionToken.aws_secret_access_key,
        sessionToken: credentials.sessionToken.aws_session_token,
      },
    });
    this.ec2Client = new EC2Client({
      region,
      credentials: {
        accessKeyId: credentials.sessionToken.aws_access_key_id,
        secretAccessKey: credentials.sessionToken.aws_secret_access_key,
        sessionToken: credentials.sessionToken.aws_session_token,
      },
    });

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
        if (this.nativeService.process.platform === "darwin") {
          this.nativeService.rimraf(this.nativeService.os.homedir() + "/" + constants.ssmSourceFileDestination, {}, () => {});
        }
        this.logService.log(new LoggedException(err.message, this, LogLevel.error, true));
      });
  }

  /**
   * Submit the request to do ssm to aws
   */
  private async requestSsmInstances(): Promise<any> {
    let tmpInstances = [];
    let instances = [];
    let nextToken = null;

    try {
      do {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const input = { MaxResults: 50, NextToken: nextToken };
        const command = new DescribeInstanceInformationCommand(input);

        const describeInstanceInformationResponse = await this.ssmClient.send(command);
        // eslint-disable-next-line max-len
        if (
          describeInstanceInformationResponse["InstanceInformationList"] &&
          describeInstanceInformationResponse["InstanceInformationList"].length > 0
        ) {
          tmpInstances = describeInstanceInformationResponse["InstanceInformationList"].filter((i) => i.PingStatus === "Online");
          if (tmpInstances.length > 0) {
            instances = instances.concat(tmpInstances);
          }
        }
        nextToken = describeInstanceInformationResponse.NextToken;
      } while (nextToken);

      if (instances.length > 0) {
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
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }

  private async applyEc2MetadataInformation(instances: any): Promise<any> {
    let reservations = [];
    let nextToken = null;

    try {
      do {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const input = { MaxResults: 100, NextToken: nextToken };
        const command = new DescribeInstancesCommand(input);
        const describeInstanceResponse = await this.ec2Client.send(command);

        reservations = reservations.concat(describeInstanceResponse.Reservations);
        nextToken = describeInstanceResponse.NextToken;
      } while (nextToken);
      instances.forEach((instance) => {
        const foundInstance = reservations.filter((r) => r.Instances[0].InstanceId === instance.Name);
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
