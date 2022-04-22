import { Pipe, PipeTransform } from "@angular/core";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws-iam-role-federated-session";
import { AzureSession } from "@noovolari/leapp-core/models/azure-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws-sso-role-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws-iam-role-chained-session";

@Pipe({
  name: "detail",
})
export class DetailPipe implements PipeTransform {
  transform(session: Session): string {
    switch (session.type) {
      case SessionType.awsIamRoleFederated:
        return (session as AwsIamRoleFederatedSession).roleArn.split("role/")[1];
      case SessionType.azure:
        return (session as AzureSession).subscriptionId;
      case SessionType.awsIamUser:
        return ""; // (sessions as AwsIamUserSession).sessionName;
      case SessionType.awsSsoRole:
        const splittedRoleArn = (session as AwsSsoRoleSession).roleArn.split("/");
        splittedRoleArn.splice(0, 1);
        return splittedRoleArn.join("/");
      case SessionType.awsIamRoleChained:
        return (session as AwsIamRoleChainedSession).roleArn.split("role/")[1];
    }
  }
}
