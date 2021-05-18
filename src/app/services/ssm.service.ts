import {Injectable} from '@angular/core';
import {ExecuteServiceService} from './execute-service.service';
import {AppService, LoggerLevel, ToastLevel} from './app.service';
import {Observable} from 'rxjs';
import {AwsCredential} from '../models/credential';
import {switchMap} from 'rxjs/operators';

const AWS = require('aws-sdk');

@Injectable({
  providedIn: 'root'
})
export class SsmService {

  ssmClient;
  ec2Client;
  instances = [];
  nextToken = -1;

  constructor(
    private app: AppService,
    private exec: ExecuteServiceService) {}

  /**
   * Prepare the two clients
   *
   * @param data - pass the credentials object
   * @param region - pass the region where you want to make the request
   * @returns - {Observable<SsmResult>} - return the list of instances capable of SSM in the selected region
   */
  setInfo(data: any, region): Observable<SsmResult> {
    // Set your SSM client and EC2 client
    AWS.config.update(this.setConfig(data, region));
    this.ssmClient = new AWS.SSM();
    this.ec2Client = new AWS.EC2();

    // Fix for Ec2 clients from electron app
    this.app.setFilteringForEc2Calls();

    // Get data
    return this.submit().pipe(
      switchMap(response => new Observable<SsmResult>(observer => {

        // eslint-disable-next-line @typescript-eslint/naming-convention
          const params = { MaxResults: 50 };
          this.ec2Client.describeInstances(params, (err, reservations) => {
            this.nextToken = reservations.NextToken;
            if (err) {
              this.app.logger('You are not Authorized to perform EC2 Describe Instance with your current credentials', LoggerLevel.error, this, err.stack);
              this.app.toast('You are not Authorized to perform EC2 Describe Instance with your current credentials, please check the log files for more information.', ToastLevel.error, 'SSM error.');
              observer.error({status: false, instances: response.instances});
            } else {
              response.instances.forEach(instance => {
                const foundInstance = reservations.Reservations.filter(r => r.Instances[0].InstanceId === instance.Name);
                if (foundInstance.length > 0) {
                  const foundName = foundInstance[0].Instances[0].Tags.filter(t => t.Key === 'Name');
                  if (foundName.length > 0) {
                    instance.Name = foundName[0].Value;
                  }
                }
              });
              observer.next(response);
            }
          });
        }))
    );
  }

  /**
   * Submit the request to do ssm to AWS
   */
  submit(): Observable<SsmResult> {
    const mythis = this;
    this.instances = [];
    return new Observable<SsmResult>(observer => {
      try {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.ssmClient.describeInstanceInformation({ MaxResults: 50 }, (err, data) => {
          if (err) {
            this.app.logger('You are not Authorized to perform SSM Describe Instance with your current credentials', LoggerLevel.error, this, err.stack);
            mythis.app.toast('You are not Authorized to perform SSM Describe Instance with your current credentials, please check the log files for more information.', ToastLevel.error, 'SSM error.');
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
                  instance['ComputerName'] = instance.InstanceId;
                  instance['Name'] = instance['ComputerName'];
                });

                // We have found and managed a list of instances
                this.app.logger('Obtained smm info from AWS for SSM', LoggerLevel.info, this);
                observer.next({status: true, instances: mythis.instances});
              } else {
                // No instances usable
                mythis.app.logger('No instances are accessible by this Role.', LoggerLevel.warn, this);
                mythis.app.toast('No instances are accessible by this Role.', ToastLevel.warn, 'No instance for SSM.');
                observer.error({status: false, instances: mythis.instances});
              }
            } else {
              // No instances usable
              mythis.app.logger('No instances are accessible by this Role.', LoggerLevel.warn, this);
              mythis.app.toast('No instances are accessible by this Role.', ToastLevel.warn, 'No instance for SSM.');
              observer.error({status: false, instances: mythis.instances});
            }
          }
          observer.complete();
        });
      } catch (err) {
        mythis.app.logger('Error making SSM call', LoggerLevel.warn, this, err.stack);
        mythis.app.toast('Error making SSM call, you\'re are not authorized to do SSM', ToastLevel.warn, 'SSM Auth error.');
        observer.error({status: false, instances: mythis.instances});
        observer.complete();
      }
    });
  }

  /**
   * Start a new ssm session given the instance id
   *
   * @param instanceId - the instance id of the instance to start
   * @param region - AWS System Manager start a session from a defined region
   */
  startSession(instanceId, region) {
    const hypen = this.app.getProcess().platform === 'darwin' ? '\'' : '';
    this.exec.openTerminal(`aws ssm start-session --region ${region} --target ${hypen}${instanceId}${hypen}`).subscribe(() => {}, err2 => {
      this.app.logger('Start SSM session error', LoggerLevel.error, this, err2.stack);
      this.app.toast(err2.stack, ToastLevel.error, 'Error in running instance via SSM');
    });
  }

  /**
   * Set the config for the SSM client
   *
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
