import { SessionType } from "../models/session-type";
import { AwsIamRoleChainedService } from "./session/aws/aws-iam-role-chained-service";
import { AwsIamRoleFederatedService } from "./session/aws/aws-iam-role-federated-service";
import { AwsIamUserService } from "./session/aws/aws-iam-user-service";
import { AwsSsoRoleService } from "./session/aws/aws-sso-role-service";
import { AzureService } from "./session/azure/azure-service";
import { CreateSessionRequest } from "./session/create-session-request";
import { SessionService } from "./session/session-service";

export class SessionFactory {
  constructor(
    private readonly awsIamUserService: AwsIamUserService,
    private readonly awsIamRoleFederatedService: AwsIamRoleFederatedService,
    private readonly awsIamRoleChainedService: AwsIamRoleChainedService,
    private readonly awsSsoRoleService: AwsSsoRoleService,
    private readonly azureService: AzureService
  ) {}

  getSessionService(sessionType: SessionType): SessionService {
    switch (sessionType) {
      case SessionType.awsIamUser:
        return this.awsIamUserService;
      case SessionType.awsIamRoleFederated:
        return this.awsIamRoleFederatedService;
      case SessionType.awsIamRoleChained:
        return this.awsIamRoleChainedService;
      case SessionType.awsSsoRole:
        return this.awsSsoRoleService;
      case SessionType.azure:
        return this.azureService;
      case SessionType.anytype:
        return this.azureService as SessionService;
    }
  }

  async createSession(sessionType: SessionType, sessionRequest: CreateSessionRequest): Promise<void> {
    const sessionService = this.getSessionService(sessionType);
    await sessionService.create(sessionRequest);
  }
}
