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

        if (dataSSM['InstanceInformationList'] && dataSSM['InstanceInformationList'].length > 0) {

          mythis.instances = dataSSM['InstanceInformationList'].filter(i => i.PingStatus === 'Online' );
          if (mythis.instances.length > 0) {

            if (dataEC2['Reservations'] && dataEC2['Reservations'].length > 0) {

              mythis.instances.forEach(instance => {
                // Add name if exists
                const instanceId = instance.InstanceId;
                const reservation = dataEC2['Reservations'].filter(res => res.Instances[0].InstanceId === instanceId);

                if (reservation) {
                  const ec2Instance = reservation[0].Instances[0];
                  const tags = ec2Instance.Tags;
                  if (tags && tags.length > 0) {
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

            return { status: true, instances: mythis.instances };
          } else {
            mythis.app.toast('No instances are accessible by this Role.', ToastLevel.WARN, 'No instance for SSM.');
            return { status: false, instances: mythis.instances };
          }
        } else {
          mythis.app.toast('No instances are accessible by this Role.', ToastLevel.WARN, 'No instance for SSM.');
          return { status: false, instances: mythis.instances };
        }
      }),
      catchError(err =>  {
        this.app.logger(err.stack, LoggerLevel.ERROR);
        mythis.app.toast('You are not Authorized to perform this operation with your current credentials, please check the log files for more information.', ToastLevel.ERROR, 'SSM error.');
        return of({ status: false, instances: mythis.instances });
      })
    );
  }

  startSession(instanceId) {
    this.exec.openTerminal(`aws ssm start-session --target '${instanceId}'\n`).subscribe(() => {
    }, err2 => {
      this.app.toast(err2.stack, ToastLevel.ERROR, 'Error in running instance via SSM');
    });

  }

  setConfig(data: { default: AwsCredential }, region) {
    // console.log(data);

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
