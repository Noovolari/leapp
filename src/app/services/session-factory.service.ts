import {Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {KeychainService} from './keychain.service';
import {AppService} from './app.service';
import {FileService} from './file.service';
import {SessionType} from '../models/session-type';
import {AwsIamUserService} from './session/aws/methods/aws-iam-user.service';
import {AwsIamRoleChainedService} from './session/aws/methods/aws-iam-role-chained.service';
import {AwsIamRoleFederatedService} from './session/aws/methods/aws-iam-role-federated.service';
import {AwsSsoRoleService} from './session/aws/methods/aws-sso-role.service';
import {AzureService} from './session/azure/azure.service';
import {ExecuteService} from './execute.service';
import {SessionService} from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SessionFactoryService {

  private sessionServiceCache: SessionService[];

  constructor(
    private workspaceService: WorkspaceService,
    private keychainService: KeychainService,
    private appService: AppService,
    private executeService: ExecuteService,
    private fileService: FileService) {

    this.sessionServiceCache = [];
  }

  getService(accountType: SessionType): SessionService {
    // Return if service is already in the cache using flyweight pattern
    this.sessionServiceCache = this.sessionServiceCache || [];

    if(this.sessionServiceCache[accountType.toString()]) {
      return this.sessionServiceCache[accountType.toString()];
    }

    // Creater and save the SessionService needed; return it to the requester
    switch (accountType) {
      case SessionType.awsFederated: return this.getAwsFederatedSessionService(accountType);
      case SessionType.awsPlain: return this.getAwsPlainSessionService(accountType);
      case SessionType.awsTruster: return this.getAwsTrusterSessionService(accountType);
      case SessionType.awsSso: return this.getAwsSsoSessionService(accountType);
      case SessionType.azure: return this.getAzureSessionService(accountType);
    }
  }

  private getAwsFederatedSessionService(accountType: SessionType) {
    const service = new AwsIamRoleFederatedService(this.workspaceService, this.keychainService, this.appService, this.fileService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsPlainSessionService(accountType: SessionType): AwsIamUserService {
    const service = new AwsIamUserService(this.workspaceService, this.keychainService, this.appService, this.fileService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsTrusterSessionService(accountType: SessionType) {
    const service = new AwsIamRoleChainedService(this.workspaceService, this.appService, this.fileService, this.keychainService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAwsSsoSessionService(accountType: SessionType) {
    const service = new AwsSsoRoleService(this.workspaceService, this.fileService, this.appService, this.keychainService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }

  private getAzureSessionService(accountType: SessionType) {
    const service = new AzureService(this.workspaceService, this.fileService, this.appService, this.executeService);
    this.sessionServiceCache[accountType.toString()] = service;
    return service;
  }
}
