import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../../models/session';
import {SessionType} from '../../../models/session-type';
import {AwsFederatedSession} from '../../../models/aws-federated-session';
import {AzureSession} from '../../../models/azure-session';
import {AwsPlainSession} from '../../../models/aws-plain-session';
import {AwsSsoSession} from '../../../models/aws-sso-session';
import {AwsTrusterSession} from '../../../models/aws-truster-session';

@Pipe({
  name: 'detail'
})
export class DetailPipe implements PipeTransform {
  transform(session: Session): string {
    switch (session.type) {
      case(SessionType.awsFederated):
        return (session as AwsFederatedSession).roleArn.split('/')[1];
      case(SessionType.azure):
        return (session as AzureSession).subscriptionId;
      case(SessionType.awsPlain):
        return (session as AwsPlainSession).sessionName;
      case(SessionType.awsSso):
        return (session as AwsSsoSession).roleArn.split('/')[1];
      case(SessionType.awsTruster):
        return (session as AwsTrusterSession).roleArn.split('/')[1];
    }
  }
}
