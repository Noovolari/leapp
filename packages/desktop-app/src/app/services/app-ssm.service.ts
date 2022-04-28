import { Injectable } from "@angular/core";
import { AppService } from "./app.service";
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";
import { ExecuteService } from "@noovolari/leapp-core/services/execute-service";
import { AppProviderService } from "./app-provider.service";
import { SsmService } from "@noovolari/leapp-core/services/ssm-service";
import { LogService } from "@noovolari/leapp-core/services/log-service";

@Injectable({
  providedIn: "root",
})
export class AppSsmService {
  ssmClient;
  ec2Client;

  private logService: LogService;
  private executeService: ExecuteService;
  private coreSsmService: SsmService;

  constructor(private appService: AppService, private leappCoreService: AppProviderService) {
    this.coreSsmService = leappCoreService.ssmService;
    this.logService = leappCoreService.logService;
    this.executeService = leappCoreService.executeService;
  }

  /**
   * Set the config for the SSM client
   *
   * @param data - the credential information
   * @param region - the region for the client
   */
  static setConfig(data: CredentialsInfo, region: string): any {
    return SsmService.setConfig(data, region);
  }

  /**
   * Prepare the two clients and returns the available
   * ssm instances for the selected region
   *
   * @param credentials - pass the credentials object
   * @param region - pass the region where you want to make the request
   * @returns - {Observable<SsmResult>} - return the list of instances capable of SSM in the selected region
   */
  async getSsmInstances(credentials: CredentialsInfo, region: string): Promise<any> {
    return await this.coreSsmService.getSsmInstances(credentials, region, () => this.appService.setFilteringForEc2Calls());
  }

  /**
   * Start a new ssm session given the instance id
   *
   * @param credentials - CredentialsInfo data from generate credentials method
   * @param instanceId - the instance id of the instance to start
   * @param region - aws System Manager start a session from a defined region
   */
  startSession(credentials: CredentialsInfo, instanceId: string, region: string): void {
    this.coreSsmService.startSession(credentials, instanceId, region);
  }
}
