import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../../models/session';
import {SessionType} from '../../../models/session-type';
import {AwsIamRoleFederatedSession} from '../../../models/aws-iam-role-federated-session';
import {AzureSession} from '../../../models/azure-session';
import {AwsIamUserSession} from '../../../models/aws-iam-user-session';
import {AwsSsoRoleSession} from '../../../models/aws-sso-role-session';
import {AwsIamRoleChainedSession} from '../../../models/aws-iam-role-chained-session';

@Pipe({
  name: 'detail'
})
export class DetailPipe implements PipeTransform {
  transform(session: Session): string {
    switch (session.type) {
      case(SessionType.awsIamRoleFederated):
        return ' - ' + (session as AwsIamRoleFederatedSession).roleArn.split('role/')[1];
      case(SessionType.azure):
        return ' - ' + (session as AzureSession).subscriptionId;
      case(SessionType.awsIamUser):
        return ''; // (session as AwsIamUserSession).sessionName;
      case(SessionType.awsSsoRole):
        return ' - ' + (session as AwsSsoRoleSession).roleArn.split('role/')[1];
      case(SessionType.awsIamRoleChained):
        return ' - ' + (session as AwsIamRoleChainedSession).roleArn.split('role/')[1];
    }
  }
}
