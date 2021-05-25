import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../models/session';
import {SessionType} from '../../models/session-type';
import {AwsFederatedAccount} from '../../models/aws-federated-account';
import {AzureAccount} from '../../models/azure-account';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import {AwsTrusterAccount} from '../../models/aws-truster-account';

@Pipe({
  name: 'detail'
})
export class DetailPipe implements PipeTransform {
  transform(session: Session): string {
    switch (session.account.type) {
      case(SessionType.awsFederated):
        return (session.account as AwsFederatedAccount).roleArn.split('/')[1];
      case(SessionType.azure):
        return (session.account as AzureAccount).subscriptionId;
      case(SessionType.awsPlain):
        return (session.account as AwsPlainAccount).accountName;
      case(SessionType.awsSso):
        return (session.account as AwsSsoAccount).role.name;
      case(SessionType.awsTruster):
        return (session.account as AwsTrusterAccount).roleArn.split('/')[1];
    }
  }
}
