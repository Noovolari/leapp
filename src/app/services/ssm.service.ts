import {Injectable} from '@angular/core';
import {ExecuteServiceService} from '../services-system/execute-service.service';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/internal/operators';
import {AwsCredential} from '../models/credential';

const SSM = require('aws-sdk/clients/ssm');
const EC2 = require('aws-sdk/clients/ec2');

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
    this.ssmClient = new SSM(this.setConfig(data, region));
    this.ec2Client = new EC2(this.setConfig(data, region));

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
    return forkJoin<any>(
      [
        new Observable(observer => {
          this.ssmClient.describeInstanceInformation({}, (err, data) => {
            if (err) {
              observer.error(err);
            } else {
              observer.next(data);
            }
            observer.complete();
          });
        }),
        new Observable(observer => {
          this.ec2Client.describeInstances({ MaxResults: 1000 }, (err, data) => {
            if (err) {
              observer.error(err);
            } else {
              observer.next(data);
            }
            observer.complete();
          });
        }).pipe(
          catchError(err => {
            return of(err);
          })
        )
      ]
    ).pipe(
      map((data: any[]) => {
        const dataSSM = data[0];
        const dataEC2 = data[1];

        // Once we have obtained data from SSM and EC2, we verify the list are not empty
        if (dataSSM['InstanceInformationList'] && dataSSM['InstanceInformationList'].length > 0) {
          // filter only the instances that are currently online
          mythis.instances = dataSSM['InstanceInformationList'].filter(i => i.PingStatus === 'Online' );
          if (mythis.instances.length > 0) {
            // If there are and the Ec2 information contains reservation...
            if (dataEC2['Reservations'] && dataEC2['Reservations'].length > 0) {
              // For every instance that fullfill we obtain...
              mythis.instances.forEach(instance => {
                // Add name if exists
                const instanceId = instance.InstanceId;
                // Get the reservation of that instance
                const reservation = dataEC2['Reservations'].filter(res => res.Instances[0].InstanceId === instanceId);
                if (reservation) {
                  // If there is, we complete getting the instance info
                  const ec2Instance = reservation[0].Instances[0];
                  // Get the instance tags
                  const tags = ec2Instance.Tags;
                  if (tags && tags.length > 0) {
                    // We set the tag name value
                    const tag = tags.filter(t => t.Key === 'Name');
                    instance['Name'] = tag[0] ? tag[0].Value : instance.InstanceId;
                  }
                } else {
                  instance['Name'] = instance.InstanceId;
                }
              });

            } else {
              mythis.instances = mythis.instances.map(i => { i['Name'] = i.InstanceId; return i; });
            }
            // We have found and managed a list of instances
            return { status: true, instances: mythis.instances };
          } else {
            // No instances usable
            mythis.app.toast('No instances are accessible by this Role.', ToastLevel.WARN, 'No instance for SSM.');
            return { status: false, instances: mythis.instances };
          }
        } else {
          // No instances usable
          mythis.app.toast('No instances are accessible by this Role.', ToastLevel.WARN, 'No instance for SSM.');
          return { status: false, instances: mythis.instances };
        }
      }),
      catchError(err =>  {
        // A problem occured
        this.app.logger(err.stack, LoggerLevel.ERROR);
        mythis.app.toast('You are not Authorized to perform this operation with your current credentials, please check the log files for more information.', ToastLevel.ERROR, 'SSM error.');
        return of({ status: false, instances: mythis.instances });
      })
    );
  }

  /**
   * Start a new ssm session given the instance id
   * @param instanceId - the instance id of the instance to start
   */
  startSession(instanceId) {
    this.exec.openTerminal(`aws ssm start-session --target '${instanceId}'\n`).subscribe(() => {
    }, err2 => {
      this.app.toast(err2.stack, ToastLevel.ERROR, 'Error in running instance via SSM');
    });

  }

  /**
   * Set the config for the SSM client
   * @param data - the credential information
   * @param region - the region for the client
   */
  setConfig(data: { default: AwsCredential }, region) {
    return {
      region,
      credentials: {
        accessKeyId: data.default.aws_access_key_id,
        secretAccessKey: data.default.aws_secret_access_key,
        sessionToken: data.default.aws_session_token
      }};
  }
}

export interface  SsmResult {
  status: boolean;
  instances: any[];
}
