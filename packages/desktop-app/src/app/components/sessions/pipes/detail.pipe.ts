import { Pipe, PipeTransform } from "@angular/core";
import { Session } from "@hesketh-racing/leapp-core/models/session";
import { SessionType } from "@hesketh-racing/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@hesketh-racing/leapp-core/models/aws/aws-iam-role-federated-session";
import { AzureSession } from "@hesketh-racing/leapp-core/models/azure/azure-session";
import { AwsSsoRoleSession } from "@hesketh-racing/leapp-core/models/aws/aws-sso-role-session";
import { AwsIamRoleChainedSession } from "@hesketh-racing/leapp-core/models/aws/aws-iam-role-chained-session";

@Pipe({
  name: "detail",
})
export class DetailPipe implements PipeTransform {
  transform(session: Session): string {
    switch (session.type) {
      case SessionType.awsIamRoleFederated:
        return (session as AwsIamRoleFederatedSession).roleArn.split("role/")[1] || "";
      case SessionType.azure:
        return (session as AzureSession).subscriptionId;
      case SessionType.awsIamUser:
        return ""; // (sessions as AwsIamUserSession).sessionName;
      case SessionType.awsSsoRole:
        const splittedRoleArn = (session as AwsSsoRoleSession).roleArn.split("/");
        splittedRoleArn.splice(0, 1);
        return splittedRoleArn.join("/");
      case SessionType.awsIamRoleChained:
        return (session as AwsIamRoleChainedSession).roleArn.split("role/")[1] || "";
    }
  }
}
