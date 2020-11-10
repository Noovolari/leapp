import {Injectable} from '@angular/core';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {Observable} from 'rxjs';
import {AwsCredential} from '../models/credential';

const AWS = require('aws-sdk');

@Injectable({
  providedIn: 'root'
})
export class SsmService {

  ssmClient;
  ec2Client;
  instances = [];

  constructor(
    private app: AppService,
    private exec: ExecuteServiceService) {}

  /**
   * Prepare the two clients
   * @param data - pass the credentials object
   * @param region - pass the region where you want to make the request
   * @returns - {Observable<SsmResult>} - return the list of instances capable of SSM in the selected region
   */
  setInfo(data: any, region): Observable<SsmResult> {
    // Set your SSM client and EC2 client
    AWS.config.update(this.setConfig(data, region));
    this.ssmClient = new AWS.SSM();

    // Fix for Ec2 clients from electron app
    this.app.setFilteringForEc2Calls();

    // Get data
    return this.submit();
  }

  /**
   * Submit the request to do ssm to AWS
   */
  submit(): Observable<SsmResult> {
    const mythis = this;
    this.instances = [];
    return new Observable(observer => {
      try {
        this.ssmClient.describeInstanceInformation({}, (err, data) => {
          if (err) {
            this.app.logger('You are not Authorized to perform SSM Describe Instance with your current credentials', LoggerLevel.ERROR, this, err.stack);
            mythis.app.toast('You are not Authorized to perform SSM Describe Instance with your current credentials, please check the log files for more information.', ToastLevel.ERROR, 'SSM error.');
            observer.error({status: false, instances: mythis.instances});
          } else {
            const dataSSM = data;
            // Once we have obtained data from SSM and EC2, we verify the list are not empty
            if (dataSSM['InstanceInformationList'] && dataSSM['InstanceInformationList'].length > 0) {
              // filter only the instances that are currently online
              mythis.instances = dataSSM['InstanceInformationList'].filter(i => i.PingStatus === 'Online');
              if (mythis.instances.length > 0) {
                // For every instance that fullfill we obtain...
                mythis.instances.forEach(instance => {
                  // Add name if exists
                  const instanceId = instance.InstanceId;
                  instance['ComputerName'] = instance['ComputerName'] || instance.InstanceId;
                  instance['Name'] = instance['ComputerName'];
                });
                // We have found and managed a list of instances
                this.app.logger('Obtained smm info from AWS for SSM', LoggerLevel.INFO, this);
                observer.next({status: true, instances: mythis.instances});
              } else {
                // No instances usable
                mythis.app.logger('No instances are accessible by this Role.', LoggerLevel.WARN, this);
                mythis.app.toast('No instances are accessible by this Role.', ToastLevel.WARN, 'No instance for SSM.');
                observer.error({status: false, instances: mythis.instances});
              }
            } else {
              // No instances usable
              mythis.app.logger('No instances are accessible by this Role.', LoggerLevel.WARN, this);
              mythis.app.toast('No instances are accessible by this Role.', ToastLevel.WARN, 'No instance for SSM.');
              observer.error({status: false, instances: mythis.instances});
            }
          }
          observer.complete();
        });
      } catch (err) {
        mythis.app.logger('Error making SSM call', LoggerLevel.WARN, this, err.stack);
        mythis.app.toast('Error making SSM call, you\'re are not authorized to do SSM', ToastLevel.WARN, 'SSM Auth error.');
        observer.error({status: false, instances: mythis.instances});
        observer.complete();
      }
    });
  }

  /**
   * Start a new ssm session given the instance id
   * @param instanceId - the instance id of the instance to start
   */
  startSession(instanceId) {
    this.exec.openTerminal(`aws ssm start-session --target '${instanceId}'`).subscribe(() => {}, err2 => {
      this.app.logger('Start SSM session error', LoggerLevel.ERROR, this, err2.stack);
      this.app.toast(err2.stack, ToastLevel.ERROR, 'Error in running instance via SSM');
    });
  }

  /**
   * Set the config for the SSM client
   * @param data - the credential information
   * @param region - the region for the client
   */
  setConfig(data: AwsCredential , region) {

    return data.aws_session_token ? {
        region,
        accessKeyId: data.aws_access_key_id,
        secretAccessKey: data.aws_secret_access_key,
        sessionToken: data.aws_session_token
      } : {
        region,
        accessKeyId: data.aws_access_key_id,
        secretAccessKey: data.aws_secret_access_key
      };
  }
}

export interface  SsmResult {
  status: boolean;
  instances: any[];
}
